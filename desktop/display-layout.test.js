import { describe, expect, it } from 'vitest'
import {
  parseSimulatedDisplayCount,
  planDisplayReconciliation,
  realDisplayTargets,
  simulatedDisplayTargets,
} from './display-layout.js'

describe('display layout', () => {
  it.each([
    [undefined, 0],
    ['', 0],
    ['1', 0],
    ['2', 2],
    ['8', 8],
    ['9', 0],
    ['many', 0],
  ])('parses simulated display count %j', (value, expected) => {
    expect(parseSimulatedDisplayCount(value)).toBe(expected)
  })

  it('preserves display ids and negative coordinates', () => {
    expect(realDisplayTargets([
      { id: 7, bounds: { x: -1920, y: 0, width: 1920, height: 1080 } },
      { id: 9, bounds: { x: 0, y: 0, width: 2560, height: 1440 } },
    ])).toEqual([
      { key: '7', bounds: { x: -1920, y: 0, width: 1920, height: 1080 } },
      { key: '9', bounds: { x: 0, y: 0, width: 2560, height: 1440 } },
    ])
  })

  it('tiles simulated displays inside one work area', () => {
    const targets = simulatedDisplayTargets({ x: 10, y: 20, width: 1440, height: 900 }, 3)
    expect(targets).toEqual([
      { key: 'simulated-1', bounds: { x: 10, y: 20, width: 712, height: 442 } },
      { key: 'simulated-2', bounds: { x: 738, y: 20, width: 712, height: 442 } },
      { key: 'simulated-3', bounds: { x: 10, y: 478, width: 712, height: 442 } },
    ])
  })

  it('recreates changed displays and removes disconnected displays', () => {
    const existing = new Map([
      ['primary', { x: 0, y: 0, width: 1440, height: 900 }],
      ['removed', { x: 1440, y: 0, width: 1920, height: 1080 }],
    ])
    const targets = [
      { key: 'primary', bounds: { x: 0, y: 0, width: 1440, height: 900 } },
      { key: 'rotated', bounds: { x: 1440, y: 0, width: 1080, height: 1920 } },
    ]

    expect(planDisplayReconciliation(existing, targets)).toEqual({
      remove: ['removed'],
      create: [targets[1]],
    })

    targets[0].bounds = { x: 0, y: 0, width: 900, height: 1440 }
    expect(planDisplayReconciliation(existing, targets)).toEqual({
      remove: ['primary', 'removed'],
      create: targets,
    })
  })
})
