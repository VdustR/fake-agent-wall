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
