import { constrainHostTraffic, HOST_PROFILE, type HostSnapshot, type SimulatedProcess } from './host-load'
import { mulberry32 } from './rng'
import { processWorkers } from './process-topology'
import type { ToolExecution, ToolProfile } from './tool-workload'

export interface SessionWorkload {
  readonly slot: number
  readonly label: string
  readonly repo: string
  readonly status: 'run' | 'cue' | 'hold' | 'done'
  readonly activeTool: ToolExecution | null
}

interface Resources {
  cpu: number
  cores: number
  rss: number
  read: number
  write: number
  rx: number
  tx: number
}
const resources = (cpu: number, cores: number, rss: number, read = 0, write = 0, rx = 0, tx = 0): Resources =>
  ({ cpu, cores, rss, read, write, rx, tx })

/** CPU budgets are percentages of one core, not percentages of the machine. */
const PROFILES: Record<ToolProfile, Resources> = {
  read: resources(5, 1, 24, 12),
  write: resources(8, 1, 32, 1, .08),
  search: resources(65, 1, 100, 70),
  remote: resources(.6, 1, 24, 0, 0, 1.5, .2),
  controller: resources(1, 1, 16),
  build: resources(360, 6, 2200, 140, 80),
  rust: resources(420, 6, 3000, 180, 100),
  go: resources(270, 4, 1500, 100, 60),
  docker: resources(380, 6, 2200, 130, 120),
  test: resources(250, 4, 1400, 40, 3),
  'test-single': resources(90, 1, 650, 20, 1),
  check: resources(95, 1, 900, 45),
  lint: resources(85, 1, 450, 35),
  'lint-parallel': resources(500, 8, 800, 95),
  install: resources(180, 4, 700, 60, 100, 700, 5),
  publish: resources(18, 2, 200, 100, 0, .5, 700),
  git: resources(22, 1, 120, 30),
  utility: resources(35, 1, 220, 10, .1),
}

const SERVICES = [
  { pid: 1, command: 'systemd', rssMiB: 64, idle: .01 },
  { pid: 412, command: 'containerd', rssMiB: 384, idle: .04 },
  { pid: 588, command: 'agent-router', rssMiB: 192, idle: .04 },
  { pid: 631, command: 'tmux: server', rssMiB: 28, idle: .02 },
  { pid: 706, command: 'sshd', rssMiB: 12, idle: .01 },
  { pid: 741, command: 'log-shipper', rssMiB: 96, idle: .03 },
  { pid: 812, command: 'metricsd', rssMiB: 48, idle: .03 },
  { pid: 936, command: 'git-maintenance', rssMiB: 128, idle: .01 },
]

function smooth(value: number): number {
  const t = Math.max(0, Math.min(1, value))
  return t * t * (3 - 2 * t)
}

function noise(seconds: number, seed: number, period: number): number {
  const position = seconds / period
  const index = Math.floor(position)
  const from = mulberry32(seed + index * 104729)()
  const to = mulberry32(seed + (index + 1) * 104729)()
  return from + (to - from) * smooth(position - index)
}

interface Candidate extends Omit<SimulatedProcess, 'cpu'> {
  demand: number
  affinity: number
}
interface RunRecord { id: number; launcher?: number; workers: number[] }
interface Scratch { sizeGiB: number; expiresAt: number }

function needsLauncher(run: ToolExecution): boolean {
  return run.descriptor.shell && /^(?:pnpm|npm|npx|yarn|bun|cargo|go|docker|uv)\s/.test(run.descriptor.command)
}

function jobResources(run: ToolExecution, now: number, slot: number) {
  const profile = PROFILES[run.descriptor.profile]
  const age = Math.max(0, (now - run.startedAt) / 1000)
  const seed = slot * 7919 + run.id * 97
  const texture = .55 + .45 * noise(age, seed, 2.8)
  const startup = .15 + .85 * smooth(age / .18)
  const batch = run.descriptor.profile === 'test' ? .18 + .82 * smooth((noise(age, seed + 31, 1.7) - .15) / .6) : 1
  const duration = run.durationMs ? run.durationMs / 1000 : undefined
  const progress = duration ? age / duration : 0
  const finishing = duration ? 1 - .92 * smooth((progress - .8) / .2) : 1
  const linking = duration && ['build', 'rust', 'go', 'docker'].includes(run.descriptor.profile)
    ? smooth((progress - .6) / .2) : 0
  // Parallel compilation hands off to a mostly serial link/export phase.
  const cpuBudget = profile.cpu + (Math.min(95, profile.cpu) - profile.cpu) * linking
  const fetching = run.descriptor.profile === 'install' && age < (duration ? duration * .65 : 1.2)
  const publishing = run.descriptor.profile === 'publish'
  const blocked = !fetching && profile.write > 30 && noise(age, seed + 211, .9) > .94
  const state: SimulatedProcess['state'] = blocked ? 'D' : fetching || publishing || run.descriptor.profile === 'remote' ? 'S' : 'R'
  const cpu = blocked ? .1 : Math.min(profile.cores * 100, (fetching ? 18 : cpuBudget) * texture * startup * batch * finishing)
  const rx = fetching ? profile.rx * texture : run.descriptor.profile === 'install' ? .5 : profile.rx * texture
  return {
    cpu,
    cores: profile.cores,
    rss: profile.rss * (.2 + .8 * smooth(age / 1.1)),
    state,
    phase: fetching ? 'fetch' as const : publishing ? 'publish' as const : 'compile' as const,
    read: fetching ? .2 : publishing ? profile.tx * texture / 8.388608 : profile.read * texture,
    write: fetching ? rx / 8.388608 : profile.write * texture,
    rx,
    tx: profile.tx * texture,
  }
}

/** One owner for session execution PIDs, resource budgets and scratch retention. */
export class SessionHost {
  #sessions = new Map<SessionWorkload, number>()
  #runs = new WeakMap<ToolExecution, RunRecord>()
  #previousRuns = new Set<ToolExecution>()
  #scratch = new Map<number, Scratch>()
  #nextPid = 20_000
  #lastNow: number | null = null
  #lastSweep = 0
  #lastFrame = -1
  #snapshot: HostSnapshot | undefined

  sample(sampledAtMs: number, now: number, sessions: readonly SessionWorkload[]): HostSnapshot {
    if (sampledAtMs === this.#lastFrame && this.#snapshot) return this.#snapshot
    const seconds = now / 1000
    const dt = this.#lastNow === null ? 0 : Math.max(0, Math.min(1, (now - this.#lastNow) / 1000))
    this.#lastNow = now
    const present = new Set(sessions)
    for (const session of this.#sessions.keys()) if (!present.has(session)) this.#sessions.delete(session)
    const candidates: Candidate[] = []
    const jobs: Array<{ phase: 'fetch' | 'compile' | 'publish'; read: number; write: number; rx: number; tx: number; record: RunRecord }> = []
    const currentRuns = new Set<ToolExecution>()

    for (const session of sessions) {
      let parent = this.#sessions.get(session)
      if (parent === undefined) {
        parent = this.#nextPid++
        this.#sessions.set(session, parent)
      }
      const active = session.activeTool
      const run = session.status === 'run' && active && active.startedAt <= now ? active : null
      const job = run ? jobResources(run, now, session.slot) : undefined
      const commands = run ? processWorkers(run, session.repo) : []
      const integrated = job && commands.length === 0
      const metadata = {
        sessionSlot: session.slot, sessionLabel: session.label, repo: session.repo,
        toolRunId: run?.id, toolCommand: run?.descriptor.command,
      }
      candidates.push({
        pid: parent, role: 'agent', affinity: parent,
        command: 'agent-client --session=' + String(session.slot).padStart(2, '0') + (run ? ' [' + run.descriptor.tool + ']' : ' [waiting]'),
        state: integrated ? job.state : 'S',
        rssMiB: 192 + (integrated ? job.rss : 0),
        demand: .04 + .08 * noise(seconds, parent, 2.1) + (integrated ? job.cpu : session.status === 'run' ? .2 : 0),
        ...metadata,
      })
      if (!run || !job) continue
      currentRuns.add(run)
      let record = this.#runs.get(run)
      if (!record) {
        const id = this.#nextPid++
        const launcher = commands.length && needsLauncher(run) ? id : undefined
        const workers = commands.map((_, index) => !launcher && index === 0 ? id : this.#nextPid++)
        record = { id, launcher, workers }
        this.#runs.set(run, record)
        this.#scratch.set(id, { sizeGiB: 0, expiresAt: Number.POSITIVE_INFINITY })
      }
      jobs.push({ phase: job.phase, read: job.read, write: job.write, rx: job.rx, tx: job.tx, record })
      if (record.launcher !== undefined) {
        candidates.push({
          pid: record.launcher, role: 'launcher', parentPid: parent, affinity: parent,
          command: run.descriptor.command, state: 'S', rssMiB: 32, demand: .15, ...metadata,
        })
      }
      const age = Math.max(0, (now - run.startedAt) / 1000)
      const weights = commands.map((worker, index) => worker.cpuWeight * (.6 + .8 * noise(age, record.id + index * 997, 1.9 + index * .3)))
      const totalCpuWeight = weights.reduce((sum, weight) => sum + weight, 0)
      const totalRssWeight = commands.reduce((sum, worker) => sum + worker.rssWeight, 0)
      commands.forEach((worker, index) => {
        candidates.push({
          pid: record.workers[index]!, role: 'worker', parentPid: record.launcher ?? parent,
          affinity: parent * 97 + index,
          command: worker.command, state: job.state, rssMiB: job.rss * worker.rssWeight / totalRssWeight,
          demand: Math.min(worker.maxCpu, job.cpu * weights[index]! / totalCpuWeight),
          ...metadata,
        })
      })
    }

    for (const run of this.#previousRuns) {
      if (currentRuns.has(run)) continue
      const record = this.#runs.get(run)
      const scratch = record && this.#scratch.get(record.id)
      if (scratch) scratch.expiresAt = now + 30_000
    }
    this.#previousRuns = currentRuns
    if (now - this.#lastSweep >= 10_000) {
      for (const [id, scratch] of this.#scratch) if (scratch.expiresAt <= now) this.#scratch.delete(id)
      this.#lastSweep = now
    }
    for (const service of SERVICES) {
      const pulse = smooth((noise(seconds, service.pid, 3.1) - .94) / .06)
      candidates.push({
        pid: service.pid, role: 'service', affinity: service.pid, command: service.command,
        state: pulse > .1 ? 'R' : 'S', rssMiB: service.rssMiB, demand: service.idle + pulse * 12,
      })
    }

    const traffic = constrainHostTraffic(jobs)
    const totalWrite = jobs.reduce((sum, job) => sum + job.write, 0)
    for (const job of jobs) {
      const scratch = this.#scratch.get(job.record.id)!
      // Repeated writes reuse a bounded workspace rather than growing forever.
      scratch.sizeGiB = Math.min(8, scratch.sizeGiB + traffic.diskWrite * job.write / Math.max(.001, totalWrite) * dt / 1024)
    }
    // Completed workspaces form an evictable artifact cache.
    let retained = [...this.#scratch.values()].reduce((sum, scratch) => sum + scratch.sizeGiB, 0)
    for (const [id, scratch] of this.#scratch) {
      if (retained <= 64) break
      if (!Number.isFinite(scratch.expiresAt)) continue
      retained -= scratch.sizeGiB
      this.#scratch.delete(id)
    }

    const remaining = Array<number>(HOST_PROFILE.logicalCpus).fill(100)
    const totalDemand = candidates.reduce((sum, process) => sum + process.demand, 0)
    const cpuScale = Math.min(1, HOST_PROFILE.logicalCpus * 100 / Math.max(.001, totalDemand))
    const totalRss = candidates.reduce((sum, process) => sum + process.rssMiB, 0)
    const rssScale = Math.min(1, 54 * 1024 / Math.max(1, totalRss))
    const processes: SimulatedProcess[] = candidates.map(process => {
      let demand = process.demand * cpuScale
      let allocated = 0
      // Fill stable preferred cores first. A single-thread budget heats one core
      // when uncontended, rather than being smeared across all sixteen.
      const affinity = remaining.map((_, core) => ({ core, weight: mulberry32(process.affinity * 7919 + core * 97)() }))
        .toSorted((a, b) => b.weight - a.weight)
      for (const { core } of affinity) {
        const amount = Math.min(remaining[core]!, demand)
        remaining[core]! -= amount
        demand -= amount
        allocated += amount
        if (demand <= 1e-9) break
      }
      return {
        pid: process.pid, parentPid: process.parentPid, role: process.role, state: process.state,
        command: process.command, cpu: allocated, rssMiB: process.rssMiB * rssScale,
        sessionSlot: process.sessionSlot, sessionLabel: process.sessionLabel, repo: process.repo,
        toolRunId: process.toolRunId, toolCommand: process.toolCommand,
      }
    })
    const cores = remaining.map(capacity => Math.max(0, 100 - capacity))
    const memoryGiB = 8 + processes.reduce((sum, process) => sum + process.rssMiB, 0) / 1024
    this.#snapshot = {
      sampledAtMs, cores, processes,
      load: {
        cpu: cores.reduce((sum, core) => sum + core, 0) / HOST_PROFILE.logicalCpus,
        memoryGiB, storageGiB: 1184 + Math.min(64, retained), ...traffic,
      },
    }
    this.#lastFrame = sampledAtMs
    return this.#snapshot
  }
}
