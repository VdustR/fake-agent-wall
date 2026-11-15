import { expect, it } from 'vitest'
import { HOST_PROFILE, type HostSnapshot } from './host-load'
import { SessionHost, type SessionWorkload } from './session-host'
import { describeTool } from './tool-workload'
import { Swarm } from './swarm.svelte'

function session(slot: number, command: string): SessionWorkload {
  return { slot, label: 'Session ' + slot, repo: 'workspace', status: 'run',
    activeTool: { id: 1, descriptor: describeTool('● Bash(' + command + ')'), startedAt: 0 } }
}
function budgets(snapshot: HostSnapshot) {
  const { load, cores, processes } = snapshot
  expect(cores).toHaveLength(HOST_PROFILE.logicalCpus)
  expect(cores.every(core => core >= 0 && core <= 100 + 1e-8)).toBe(true)
  const sum = cores.reduce((total, core) => total + core, 0)
  expect(load.cpu).toBeCloseTo(sum / HOST_PROFILE.logicalCpus, 8)
  expect(processes.reduce((total, process) => total + process.cpu, 0)).toBeCloseTo(sum, 8)
  expect(new Set(processes.map(p => p.pid)).size).toBe(processes.length)
  expect(processes.reduce((total, p) => total + p.rssMiB, 0) / 1024).toBeLessThanOrEqual(load.memoryGiB)
  expect(load.memoryGiB).toBeLessThan(HOST_PROFILE.memoryGiB)
  expect(load.storageGiB).toBeLessThan(HOST_PROFILE.storageGiB)
  expect(load.diskRead + load.diskWrite).toBeLessThanOrEqual(HOST_PROFILE.diskMiBs + 1e-8)
  expect(Math.max(load.netRx, load.netTx)).toBeLessThanOrEqual(HOST_PROFILE.networkMbps + 1e-8)
  expect(Object.values(load).every(Number.isFinite)).toBe(true)
}
it('distinguishes single-thread checks from parallel compilation', () => {
  const single = new SessionHost().sample(2000, 2000, [session(1, 'pnpm tsc --noEmit')])
  const worker = single.processes.find(p => p.role === 'worker')!
  expect(worker.cpu).toBeGreaterThan(40)
  expect(worker.cpu).toBeLessThanOrEqual(100)
  expect(single.cores.filter(core => core > 40)).toHaveLength(1)
  expect(single.load.cpu).toBeLessThan(8)
  const parallel = new SessionHost().sample(2000, 2000, [session(1, 'cargo build --release')])
  expect(parallel.processes.filter(p => p.role === 'worker')).toHaveLength(3)
  expect(parallel.processes.reduce((sum, p) => sum + p.cpu, 0)).toBeGreaterThan(100)
  budgets(single)
  budgets(parallel)
})
it('releases tool processes and working sets, retains then cleans scratch, and keeps the parent PID', () => {
  const host = new SessionHost()
  const owner: { -readonly [K in keyof SessionWorkload]: SessionWorkload[K] } = session(1, 'cargo build --release')
  let busy = host.sample(0, 0, [owner])
  for (let time = 250; time <= 3000; time += 250) busy = host.sample(time, time, [owner])
  const parent = busy.processes.find(p => p.role === 'agent')!.pid
  owner.activeTool = null
  const idle = host.sample(3250, 3250, [owner])
  expect(idle.processes.some(p => p.role === 'worker' || p.role === 'launcher')).toBe(false)
  expect(busy.load.memoryGiB - idle.load.memoryGiB).toBeGreaterThan(2)
  expect(idle.load.storageGiB).toBeGreaterThan(1184)
  // Preserve object identity across the execution lifecycle.
  const activeOwner = { ...owner, activeTool: null }
  const stable = new SessionHost()
  const first = stable.sample(0, 0, [activeOwner]).processes.find(p => p.role === 'agent')!.pid
  expect(stable.sample(250, 250, [activeOwner]).processes.find(p => p.role === 'agent')!.pid).toBe(first)
  expect(stable.sample(500, 500, [{ ...activeOwner }]).processes.find(p => p.role === 'agent')!.pid).not.toBe(first)
  expect(idle.processes.find(p => p.role === 'agent')!.pid).toBe(parent)
  expect(host.sample(45000, 45000, []).load.storageGiB).toBe(1184)
})
it('does not create workers for held sessions or future tool calls', () => {
  const owner = session(1, 'pnpm build')
  expect(new SessionHost().sample(0, 0, [{ ...owner, status: 'hold' }]).processes.some(p => p.role === 'worker')).toBe(false)
  expect(new SessionHost().sample(0, 0, [{ ...owner, activeTool: { ...owner.activeTool!, startedAt: 1000 } }]).processes.some(p => p.role === 'worker')).toBe(false)
})
it('conserves shared CPU, memory and traffic under contention', () => {
  const commands = ['pnpm tsc --noEmit', 'cargo build', 'pnpm install', 'docker push image', 'pnpm vitest run', 'pnpm oxlint src']
  const sessions = Array.from({ length: 80 }, (_, slot) => session(slot, commands[slot % commands.length]!))
  const host = new SessionHost()
  let saturated = false
  for (let time = 0; time < 30000; time += 997) {
    const snapshot = host.sample(time, time, sessions)
    budgets(snapshot)
    saturated ||= snapshot.load.cpu > 95
    expect(snapshot.processes.filter(p => p.command.startsWith('node tsc')).every(p => p.cpu <= 100)).toBe(true)
  }
  expect(saturated).toBe(true)
})
it('keeps demand and core affinity continuous within the same execution', () => {
  const host = new SessionHost()
  const owners = [session(1, 'pnpm tsc --noEmit')]
  for (let time = 250; time < 120000; time += 997) {
    const before = host.sample(time - 1, time - 1, owners)
    const after = host.sample(time + 1, time + 1, owners)
    expect(Math.abs(after.load.cpu - before.load.cpu)).toBeLessThan(1)
    expect(Math.max(...after.cores.map((value, core) => Math.abs(value - before.cores[core]!)))).toBeLessThan(2)
  }
})
it('samples shared core/process state once per quarter second and appends history without rewriting it', () => {
  const swarm = new Swarm()
  const first = swarm.host
  const history = swarm.hostHistory
  const now = performance.now()
  swarm.frame(now, 100)
  swarm.frame(now + 100, 100)
  expect(swarm.host).toBe(first)
  expect(swarm.hostHistory).toBe(history)
  swarm.frame(now + 200, 100)
  expect(swarm.host.sampledAtMs).toBe(250)
  expect(swarm.host).not.toBe(first)
  expect(swarm.hostHistory).toHaveLength(128)
  expect(swarm.hostHistory.slice(0, -1)).toEqual(history.slice(1))
  expect(swarm.hostHistory.at(-1)!.cpu).toBeCloseTo(swarm.host.load.cpu, 8)
})

it('uses tool-specific process composition and unequal worker working sets', () => {
  const browser = new SessionHost().sample(2000, 2000, [session(1, 'pnpm exec playwright test --project=chromium')])
  const browserWorkers = browser.processes.filter(p => p.role === 'worker')
  expect(browserWorkers.some(p => p.command.includes('--type=renderer'))).toBe(true)
  expect(browserWorkers.some(p => p.command.includes('--type=gpu-process'))).toBe(true)
  expect(new Set(browserWorkers.map(p => p.rssMiB)).size).toBeGreaterThan(1)
  const rust = new SessionHost().sample(2000, 2000, [session(2, 'cargo test --workspace')])
  const rustWorkers = rust.processes.filter(p => p.role === 'worker')
  expect(rustWorkers).toHaveLength(1)
  expect(rustWorkers[0]!.command).toContain('target/debug/deps/workspace-')
  const build = new SessionHost().sample(2000, 2000, [session(3, 'cargo build')])
  expect(new Set(build.processes.filter(p => p.role === 'worker').map(p => p.cpu)).size).toBeGreaterThan(1)
  budgets(browser)
  budgets(rust)
  budgets(build)
})

it('retains worker identities while their relative load changes smoothly', () => {
  const owner = session(1, 'pnpm vitest run')
  const host = new SessionHost()
  const first = host.sample(2000, 2000, [owner]).processes.filter(p => p.role === 'worker')
  const later = host.sample(3000, 3000, [owner]).processes.filter(p => p.role === 'worker')
  expect([...first, ...later].every(p => p.cpu <= 100)).toBe(true)
  expect(later.map(p => p.pid)).toEqual(first.map(p => p.pid))
  expect(later.map(p => p.command)).toEqual(first.map(p => p.command))
  expect(first[0]!.cpu / first[1]!.cpu).not.toBeCloseTo(later[0]!.cpu / later[1]!.cpu, 3)
  expect(later.every(p => p.toolRunId === owner.activeTool!.id && p.sessionSlot === owner.slot)).toBe(true)
})

it('keeps long downloads network-bound before extraction and reduces CPU in the finishing tail', () => {
  const download = session(1, 'pnpm install')
  const install = { ...download, activeTool: { ...download.activeTool!, durationMs: 20000 } }
  const host = new SessionHost()
  const fetching = host.sample(5000, 5000, [install])
  const extracting = host.sample(15000, 15000, [install])
  expect(fetching.load.netRx).toBeGreaterThan(300)
  expect(extracting.load.netRx).toBeLessThan(1)
  expect(extracting.load.cpu).toBeGreaterThan(fetching.load.cpu * 3)
  expect(extracting.processes.map(p => p.pid)).toEqual(fetching.processes.map(p => p.pid))
  const build = session(2, 'cargo build')
  const owner = { ...build, activeTool: { ...build.activeTool!, durationMs: 60000 } }
  const compile = host.sample(30000, 30000, [owner])
  const linking = host.sample(48000, 48000, [owner])
  expect(linking.processes.filter(process => process.role === 'worker').reduce((sum, process) => sum + process.cpu, 0)).toBeLessThanOrEqual(100)
  const finishing = host.sample(59000, 59000, [owner])
  expect(finishing.load.cpu).toBeLessThan(compile.load.cpu * .3)
  budgets(fetching)
  budgets(extracting)
  budgets(finishing)
})
