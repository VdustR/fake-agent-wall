import { expect, it } from 'vitest'
import { OperationsWorld } from './operations.svelte'
import { Swarm } from './swarm.svelte'

it('keeps every operations rotation feasible with the host instruments taking vertical space', () => {
  const world = new OperationsWorld(new Swarm())
  world.setViewport(1014, 604)
  for (let epoch = 0; epoch < 8; epoch += 1) {
    world.layoutEpoch = epoch
    expect(world.layoutViolations, `rotation ${epoch}`).toEqual([])
    expect(world.gridItems.filter(item => item.type === 'agent').length).toBeGreaterThanOrEqual(2)
  }
})


it('keeps system status independent and offers a process monitor when the wall has room', () => {
  const world = new OperationsWorld(new Swarm())
  world.setViewport(1426, 740)
  expect(world.gridItems.filter(item => item.type === 'system')).toHaveLength(1)
  expect(world.gridItems.some(item => item.kind === 'processes')).toBe(true)
  world.setViewport(380, 658)
  expect(world.gridItems.filter(item => item.type === 'system')).toHaveLength(1)
  expect(world.gridItems.some(item => item.type === 'agent')).toBe(true)
  expect(world.layoutViolations).toEqual([])
})
