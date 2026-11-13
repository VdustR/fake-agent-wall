import { expect, it } from 'vitest'
import { hostLoad, hostSnapshot, HOST_PROFILE } from './host-load'
import { Swarm } from './swarm.svelte'

it('keeps simulated utilization and directional rates within their printed capacities', () => {
  for (let time = 0; time < 600_000; time += 997) {
    const load = hostLoad(time, (time % 100) / 100)
    expect(load.cpu).toBeGreaterThanOrEqual(0)
    expect(load.cpu).toBeLessThanOrEqual(100)
    expect(load.memoryGiB).toBeGreaterThan(0)
    expect(load.memoryGiB).toBeLessThan(HOST_PROFILE.memoryGiB)
    expect(load.storageGiB).toBeLessThan(HOST_PROFILE.storageGiB)
    expect(load.diskRead + load.diskWrite).toBeLessThanOrEqual(HOST_PROFILE.diskMiBs)
    expect(Math.max(load.netRx, load.netTx)).toBeLessThanOrEqual(HOST_PROFILE.networkMbps)
    expect(Object.values(load).every(Number.isFinite)).toBe(true)
  }
})

it('shows busy/idle CPU, allocation steps, batch release and temporary storage cleanup', () => {
  const samples = Array.from({ length: 1200 }, (_, i) => hostLoad(i * 250, .7))
  const cpu = samples.map(s => s.cpu)
  expect(Math.max(...cpu) - Math.min(...cpu)).toBeGreaterThan(65)
  const changes = samples.slice(1).map((s, i) => ({
    memory: s.memoryGiB - samples[i]!.memoryGiB,
    storage: s.storageGiB - samples[i]!.storageGiB,
  }))
  expect(changes.some(s => s.memory > 1)).toBe(true)
  expect(changes.some(s => s.memory < -4)).toBe(true)
  expect(changes.some(s => s.storage < -2)).toBe(true)
  expect(samples.every(s => s.storageGiB >= 1184)).toBe(true)
  expect(samples.some(s => s.netRx < 15 && s.netTx < 15)).toBe(true)
  expect(samples.some(s => s.diskRead > 100 && s.netRx < 25)).toBe(true)
  expect(samples.some(s => s.netRx > 200 && s.netTx < 70)).toBe(true)
  expect(samples.some(s => s.netTx > 150 && s.netRx < 50)).toBe(true)
  expect(hostLoad(23_000, .7)).toEqual(hostLoad(23_000, .7))
})

it('accounts for process CPU on individual logical cores without changing the host average', () => {
  let multithreaded = false
  let uneven = false
  for (let time = 0; time < 120_000; time += 997) {
    const snapshot = hostSnapshot(time, .7)
    expect(snapshot.cores).toHaveLength(HOST_PROFILE.logicalCpus)
    expect(snapshot.cores.every(core => core >= 0 && core <= 100 + 1e-8)).toBe(true)
    const sum = snapshot.cores.reduce((total, core) => total + core, 0)
    expect(snapshot.load.cpu).toBeCloseTo(sum / HOST_PROFILE.logicalCpus, 8)
    expect(snapshot.processes.reduce((total, process) => total + process.cpu, 0)).toBeCloseTo(sum, 8)
    expect(new Set(snapshot.processes.map(p => p.pid)).size).toBe(snapshot.processes.length)
    expect(snapshot.processes.reduce((total, p) => total + p.rssMiB, 0) / 1024).toBeLessThanOrEqual(snapshot.load.memoryGiB)
    multithreaded ||= snapshot.processes.some(p => p.cpu > 100)
    uneven ||= Math.max(...snapshot.cores) - Math.min(...snapshot.cores) > 20
    expect(snapshot.load.cpu).toBeCloseTo(hostLoad(time, .7).cpu, 8)
  }
  expect(multithreaded).toBe(true)
  expect(uneven).toBe(true)
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


it('keeps CPU demand and core affinity continuous across sampling and scheduler boundaries', () => {
  for (let time = 250; time < 120_000; time += 250) {
    const before = hostSnapshot(time - 1, .7)
    const after = hostSnapshot(time + 1, .7)
    expect(Math.abs(after.load.cpu - before.load.cpu), `CPU at ${time}`).toBeLessThan(1)
    expect(Math.max(...after.cores.map((value, core) => Math.abs(value - before.cores[core]!))), `cores at ${time}`).toBeLessThan(2)
  }
})
