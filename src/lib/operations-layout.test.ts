import { expect, it } from 'vitest'
import { OperationsWorld } from './operations.svelte'
import { Swarm } from './swarm.svelte'
import { dimensionsFor, packMosaic } from './mosaic-layout'

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

it('keeps a compact system from consuming a whole spare bay when a smaller placement fits', () => {
  const width = 625
  const height = 626
  const world = new OperationsWorld(new Swarm())
  world.setViewport(width, height)
  const items = world.gridItems
  const system = items.find(item => item.type === 'system')!
  const packed = packMosaic(items, width, height)
  const size = dimensionsFor(packed.rects.get(system.key)!, width, height)
  expect(packed.feasible).toBe(true)
  expect(size.width * size.height).toBeLessThan((system.preferredWidth! * system.preferredHeight!) * 2)
})
