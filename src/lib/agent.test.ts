import { expect, it } from 'vitest'
import { Agent } from './agent.svelte'
import { DECISION_MODELS } from './corpus'
import { SessionHost } from './session-host'

it('completes a decision promptly and keeps its result readable for eight seconds', () => {
  const agent = new Agent(4, 123)
  agent.calm = true
  agent.task = 'make webhook replay idempotent'

  let now = performance.now()
  let startedAt: number | null = null
  let completedAt: number | null = null

  for (let step = 0; step < 4_000 && completedAt === null; step += 1) {
    now += 50
    agent.task = 'make webhook replay idempotent'
    agent.tick(now, 50)
    if (startedAt === null && agent.lines.at(-1)?.s.startsWith('● Decide(')) startedAt = now
    if (agent.recentDecision) completedAt = now
  }

  expect(startedAt, `task=${agent.task} status=${agent.status} lines=${agent.lines.at(-1)?.s}`).not.toBeNull()
  expect(completedAt).not.toBeNull()
  expect(completedAt! - startedAt!).toBeLessThanOrEqual(600)
  expect(DECISION_MODELS.some(model => agent.recentDecision?.text === `${model.name} · inspect replay guard`)).toBe(true)

  const until = agent.recentDecision!.until
  agent.tick(until - 1, 0)
  expect(agent.recentDecision).not.toBeNull()
  agent.tick(until, 0)
  expect(agent.recentDecision).toBeNull()
})

it('updates an install progress bar in place during playback', () => {
  const agent = new Agent(3, 42)
  let now = performance.now()
  let installEvent = 0
  const seen = new Set<number>()

  for (let step = 0; step < 8_000; step += 1) {
    now += 100
    agent.tick(now, 100)
    if (!installEvent && agent.lastEvent && /Bash\((ollama pull|brew install|mise install|pnpm install)/.test(agent.lastEvent.text)) {
      installEvent = agent.lastEvent.n
    }
    if (!installEvent || agent.lastEvent?.n !== installEvent) continue

    const latestCommand = agent.lines.findLastIndex(line => line.k === 'tool')
    const progress = agent.lines.slice(latestCommand + 1)
      .filter(line => /\[[█░]{10}\] +\d+%/.test(line.s))
    if (progress.length) seen.add(Number(progress[0]?.s.match(/\] +(\d+)%/)?.[1]))
    expect(progress.length).toBeLessThanOrEqual(1)
    if (seen.has(100)) break
  }

  expect(installEvent).toBeGreaterThan(0)
  expect(seen.size).toBeGreaterThanOrEqual(2)
  expect(seen.has(100)).toBe(true)
})

it.each([false, true])('keeps long tool workers alive until the execution timeline ends (calm=%s)', calm => {
  const agent = new Agent(3, 42)
  agent.calm = calm
  let now = performance.now()
  for (let step = 0; step < 10000; step++) {
    now += 50
    agent.tick(now, 50)
    if (agent.activeTool && ['build', 'rust', 'go', 'docker', 'test', 'install'].includes(agent.activeTool.descriptor.profile)) break
  }
  const execution = agent.activeTool!
  expect(execution).not.toBeNull()
  expect(agent.partial).toBeNull()
  expect(execution.durationMs).toBeGreaterThanOrEqual(6000)
  const deadline = execution.startedAt + execution.durationMs!
  const host = new SessionHost()
  const workers = () => host.sample(now, now, [agent]).processes.filter(process => process.role === 'worker').map(process => process.pid)
  const pids = workers()
  expect(pids.length).toBeGreaterThan(0)
  while (now < deadline - 50) {
    now += 50
    agent.tick(now, 50)
    expect(agent.activeTool).toBe(execution)
    expect(workers()).toEqual(pids)
  }
  while (agent.activeTool === execution && now < deadline + 3000) {
    now += 50
    agent.tick(now, 50)
  }
  expect(agent.activeTool).not.toBe(execution)
  expect(workers()).toHaveLength(0)
  expect(now).toBeGreaterThanOrEqual(deadline)
  expect(now).toBeLessThan(deadline + 3000)
})
