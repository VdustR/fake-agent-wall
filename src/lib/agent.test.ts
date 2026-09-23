import { expect, it } from 'vitest'
import { Agent } from './agent.svelte'

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
  expect(agent.recentDecision?.text).toContain('jev · inspect replay guard')

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
