import { mulberry32 } from './rng'

/** A fictional host profile; never inferred from the viewer's device. */
export const HOST_PROFILE = { logicalCpus: 16, memoryGiB: 64, storageGiB: 2048, diskMiBs: 800, networkMbps: 1000 } as const
export const HOST_SAMPLE_MS = 250
export const HOST_HISTORY_SAMPLES = 128
export type HostLoad = ReturnType<typeof hostLoad>

const ease = (value: number) => {
  const t = Math.max(0, Math.min(1, value))
  return t * t * (3 - 2 * t)
}

/** Continuous seeded demand: adjacent samples share the same evolving anchors. */
function demandNoise(seconds: number, seed: number, period: number): number {
  const position = seconds / period
  const index = Math.floor(position)
  const from = mulberry32(seed + index * 104729)()
  const to = mulberry32(seed + (index + 1) * 104729)()
  return from + (to - from) * ease(position - index)
}

/** Seeded jobs have variable phases, not five unrelated oscillators. */
function jobLoad(seconds: number, lane: number) {
  const period = [61, 73, 89][lane]!
  const offset = [0, 19, 47][lane]!
  const age = seconds + offset
  const cycle = Math.floor(age / period)
  const time = age % period
  const random = mulberry32(7919 * (lane + 1) + cycle * 104729)
  const fetchEnd = 5 + random() * 5
  const compileEnd = fetchEnd + 10 + random() * 9
  const testEnd = compileEnd + 9 + random() * 8
  const publishEnd = testEnd + 3 + random() * 4
  const cleanupEnd = publishEnd + 1 + random() * 2
  const workingSet = 7 + random() * 7
  const workspace = 3 + random() * 10
  const reserve = .8 + random() * .8
  const chatter = mulberry32(cycle * 104729 + lane * 7919 + Math.floor(time * 4) * 97)()
  const packet = chatter > .22 ? .4 + chatter * .6 : .03
  let memory = reserve
  let storage = 0
  let read = .2
  let write = .1
  let rx = .5
  let tx = .3
  if (time < fetchEnd) {
    const progress = time / fetchEnd
    rx = (330 + random() * 480) * packet
    write = rx / 8.388608
    memory += workingSet * .25 * progress
    storage = workspace * .3 * progress
  } else if (time < compileEnd) {
    const progress = (time - fetchEnd) / (compileEnd - fetchEnd)
    memory += workingSet * (.25 + .75 * Math.min(1, progress * 6))
    storage = workspace * (.3 + .7 * progress)
    read = 100 + chatter * 240
    write = 25 + chatter * 140
  } else if (time < testEnd) {
    const progress = (time - compileEnd) / (testEnd - compileEnd)
    // Index/test buffers are allocated in batches, then one batch is collected.
    memory += workingSet * (progress < .22 ? 1 : progress < .68 ? 1.3 : .95)
    storage = workspace
    read = 12 + chatter * 120
    write = chatter > .75 ? 65 : 2
  } else if (time < publishEnd) {
    tx = (220 + random() * 440) * packet
    read = tx / 8.388608
    memory += workingSet * .8
    storage = workspace
  } else if (time < cleanupEnd) {
    write = 3 + chatter * 6
    // Process exit frees the working set; workspace deletion follows as a batch.
    storage = time - publishEnd < .5 ? workspace : 0
  }
  const phaseEnds = [fetchEnd, compileEnd, testEnd, publishEnd, cleanupEnd, period]
  const phases = ['fetch', 'compile', 'test', 'publish', 'cleanup', 'idle'] as const
  const stage = phaseEnds.findIndex(end => time < end)
  const phase = phases[stage]!
  const texture = .75 * demandNoise(age, lane * 7919 + 31, 2.8)
    + .25 * demandNoise(age, lane * 7919 + 97, .8)
  const testBatch = ease((demandNoise(age, lane * 7919 + 211, 3.4) - .2) / .5)
  const cpuTargets = [3 + texture * 8, 28 + texture * 38, 3 + (15 + texture * 33) * testBatch, 7 + texture * 9, 4 + texture * 8, 1 + texture * 2]
  const start = stage === 0 ? 0 : phaseEnds[stage - 1]!
  const previous = cpuTargets[stage === 0 ? 5 : stage - 1]!
  // Process ramps retain continuity; allocations and cleanup remain discrete.
  const cpu = previous + (cpuTargets[stage]! - previous) * ease((time - start) / .85)
  return { cpu, memory, storage, read, write, rx, tx, phase, cycle }
}

interface HostTrafficSource {
  phase: ReturnType<typeof jobLoad>['phase']
  read: number
  write: number
  rx: number
  tx: number
}

/** Link throttling must also throttle the disk work caused by that payload. */
export function constrainHostTraffic(jobs: readonly HostTrafficSource[]) {
  const rx = jobs.reduce((sum, job) => sum + job.rx, 0)
  const tx = jobs.reduce((sum, job) => sum + job.tx, 0)
  const rxScale = Math.min(1, HOST_PROFILE.networkMbps / Math.max(1, rx))
  const txScale = Math.min(1, HOST_PROFILE.networkMbps / Math.max(1, tx))
  const read = jobs.reduce((sum, job) => sum + job.read * (job.phase === 'publish' ? txScale : 1), 0)
  const write = jobs.reduce((sum, job) => sum + job.write * (job.phase === 'fetch' ? rxScale : 1), 0)
  const diskScale = Math.min(1, HOST_PROFILE.diskMiBs / Math.max(1, read + write))
  const diskRead = read * diskScale
  return {
    netRx: Math.min(HOST_PROFILE.networkMbps, rx),
    netTx: Math.min(HOST_PROFILE.networkMbps, tx),
    diskRead,
    diskWrite: Math.min(write * diskScale, HOST_PROFILE.diskMiBs - diskRead),
  }
}

export function hostLoad(elapsedMs: number, activity: number) {
  // Start in an established workload so initial histories contain real phases.
  const seconds = Math.max(0, elapsedMs / 1000 + 120)
  const busy = Math.max(0, Math.min(1, activity))
  const jobs = [0, 1, 2].map(lane => jobLoad(seconds, lane))
  const sum = (key: 'cpu' | 'memory' | 'storage') => jobs.reduce((total, job) => total + job[key], 0)
  const traffic = constrainHostTraffic(jobs)
  return {
    cpu: Math.min(99, 3 + sum('cpu') * (.75 + busy * .25)),
    memoryGiB: Math.min(62, 8 + sum('memory')),
    // Retained system/artifact data is separate from temporary job workspaces.
    storageGiB: 1184 + 4 * (1 - Math.exp(-seconds / 720)) + sum('storage'),
    ...traffic,
  }
}

export interface SimulatedProcess {
  pid: number
  state: 'R' | 'S' | 'D'
  cpu: number
  rssMiB: number
  command: string
}
export type HostSnapshot = ReturnType<typeof hostSnapshot>

const SERVICES = [
  { pid: 1, command: 'systemd', rssMiB: 64, share: .08 },
  { pid: 412, command: 'containerd', rssMiB: 384, share: .18 },
  { pid: 588, command: 'agent-router', rssMiB: 192, share: .26 },
  { pid: 631, command: 'tmux: server', rssMiB: 28, share: .06 },
  { pid: 706, command: 'sshd', rssMiB: 12, share: .02 },
  { pid: 741, command: 'log-shipper', rssMiB: 96, share: .13 },
  { pid: 812, command: 'metricsd', rssMiB: 48, share: .11 },
  { pid: 936, command: 'git-maintenance', rssMiB: 128, share: .16 },
]

/** Allocate each task's CPU budget across bounded cores; every column conserves work. */
export function hostSnapshot(elapsedMs: number, activity: number) {
  const load = hostLoad(elapsedMs, activity)
  const seconds = Math.max(0, elapsedMs / 1000 + 120)
  const busy = Math.max(0, Math.min(1, activity))
  const jobs = [0, 1, 2].map(lane => jobLoad(seconds, lane))
  const candidates = [
    ...jobs.map((job, lane) => ({
      pid: 2000 + lane * 100000 + job.cycle % 5000 * 13,
      affinity: 10000 + lane,
      command: `agent-worker --lane=${lane + 1} [${job.phase}]`,
      rssMiB: job.memory * 1024,
      demand: job.cpu * (.75 + busy * .25),
      state: job.phase === 'compile' && job.cpu < 35 ? 'D' as const : job.cpu > 5 ? 'R' as const : 'S' as const,
    })),
    ...SERVICES.map(service => ({ pid: service.pid, affinity: service.pid, command: service.command, rssMiB: service.rssMiB, demand: service.share * 3, state: 'S' as const })),
  ]
  const totalDemand = candidates.reduce((sum, process) => sum + process.demand, 0)
  const remaining = Array<number>(HOST_PROFILE.logicalCpus).fill(100)
  const processes: SimulatedProcess[] = candidates.map(process => {
    // Warm worker lanes keep their core preferences across PID turnover. Slow
    // drift permits migration without re-shuffling the machine every two seconds.
    const weights = remaining.map((_, core) => {
      const seed = process.affinity * 7919 + core * 97
      const home = mulberry32(seed)()
      const drift = demandNoise(seconds, seed, 19 + core % 5 * 3)
      return .03 + (.75 * home + .25 * drift) ** 3
    })
    let demand = process.demand / totalDemand * load.cpu * HOST_PROFILE.logicalCpus
    let allocated = 0
    // Each saturated core leaves the pool. At most one pass per core is needed.
    for (let pass = 0; pass < HOST_PROFILE.logicalCpus && demand > 1e-9; pass += 1) {
      const weight = weights.reduce((sum, value, core) => sum + (remaining[core]! > 1e-9 ? value : 0), 0)
      if (weight === 0) break
      let used = 0
      for (let core = 0; core < remaining.length; core += 1) {
        if (remaining[core]! <= 1e-9) continue
        const amount = Math.min(remaining[core]!, demand * weights[core]! / weight)
        remaining[core]! -= amount
        used += amount
      }
      allocated += used
      demand -= used
    }
    return { pid: process.pid, command: process.command, rssMiB: process.rssMiB, cpu: allocated, state: process.state }
  })
  const cores = remaining.map(capacity => 100 - capacity)
  return {
    sampledAtMs: elapsedMs,
    load: { ...load, cpu: cores.reduce((sum, core) => sum + core, 0) / cores.length },
    cores,
    processes,
  }
}
