import { expect, it } from 'vitest'
import { Swarm } from './swarm.svelte'

it('resolves indexed routing to source identities, including one-based source numbers', () => {
  const swarm = new Swarm()
  expect(swarm.programAgent).toBe(swarm.agents[0])
  expect(swarm.programAgent.slot).toBe(1)
  expect(swarm.previewAgent).toBeUndefined()
  swarm.pgm = 2
  swarm.pst = 4
  expect(swarm.programAgent.slot).toBe(3)
  expect(swarm.previewAgent?.slot).toBe(5)
  expect(swarm.previewAgent).not.toBe(swarm.programAgent)
})

it('keeps routing identities valid after the selected sources retire', () => {
  const swarm = new Swarm()
  swarm.ensureAgentCount(50)
  swarm.pgm = 40
  swarm.pst = 45
  expect(swarm.programAgent.slot).toBe(41)
  swarm.setAgentCount(26)
  expect(swarm.programAgent).toBe(swarm.agents[0])
  expect(swarm.previewAgent).toBeUndefined()
})
