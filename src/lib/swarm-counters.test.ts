import { expect, it } from 'vitest'
import { Swarm } from './swarm.svelte'

it('preserves observed cumulative totals when agents leave or join the viewport', () => {
  const swarm = new Swarm()
  swarm.ensureAgentCount(60)
  const now = performance.now()
  swarm.frame(now, 1)
  const tokens = swarm.totalTokens
  const tools = swarm.totalTools
  expect(tokens).toBeGreaterThan(0)
  swarm.setAgentCount(26)
  swarm.frame(now + 1, 1)
  expect(swarm.totalTokens).toBe(tokens)
  expect(swarm.totalTools).toBe(tools)
  swarm.ensureAgentCount(60)
  swarm.frame(now + 2, 1)
  expect(swarm.totalTokens).toBe(tokens)
  expect(swarm.totalTools).toBe(tools)
  expect(swarm.tokensPerMin).toBe(0)
  expect(swarm.toolsPerMin).toBe(0)
})

it('does not count newly seeded scrollback as current throughput', () => {
  const swarm = new Swarm()
  const now = performance.now()
  swarm.frame(now, 1)
  swarm.ensureAgentCount(60)
  swarm.frame(now + 1, 1)
  expect(swarm.tokensPerMin).toBe(0)
  expect(swarm.toolsPerMin).toBe(0)
})

it('lets a replacement source publish its first event after its slot was retired', () => {
  const swarm = new Swarm()
  swarm.ensureAgentCount(60)
  const now = performance.now()
  swarm.agents[40]!.lastEvent = { n: 100, text: 'old worker event' }
  swarm.frame(now, 1)
  swarm.setAgentCount(26)
  swarm.ensureAgentCount(60)
  swarm.agents[40]!.lastEvent = { n: 1, text: 'replacement worker event' }
  swarm.frame(now + 1, 1)
  expect(swarm.ticker[0]?.text).toBe('replacement worker event')
  const count = swarm.ticker.length
  swarm.frame(now + 2, 1)
  expect(swarm.ticker).toHaveLength(count)
})
