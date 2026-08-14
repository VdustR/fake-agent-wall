import { describe, expect, it } from 'vitest'
import {
  dimensionsFor,
  packMosaic,
  targetViewportCapacity,
  violationsFor,
  type MosaicItem,
} from './mosaic-layout'

const pgm: MosaicItem = {
  key: 'pgm', type: 'pgm', preferredAspect: 1.38, preferredWidth: 920,
  preferredHeight: 660, minAspect: 1.05, maxAspect: 2, weight: 5.5,
  minWidth: 320, minHeight: 240,
}

const telemetry: MosaicItem = {
  key: 'telemetry', type: 'telemetry', preferredAspect: 3.2,
  preferredWidth: 760, preferredHeight: 260, minAspect: 2.4, maxAspect: 5,
  weight: 2.2, minWidth: 300, minHeight: 145,
  variants: [
    { minWidth: 520, minHeight: 330, minAspect: 1.6, maxAspect: 5 },
    { minWidth: 520, minHeight: 145, minAspect: 2.4, maxAspect: 6 },
    { minWidth: 300, minHeight: 220, minAspect: 0.65, maxAspect: 1.8 },
    { minWidth: 300, minHeight: 145, minAspect: 1.8, maxAspect: 6 },
  ],
}

function fixtures(count: number): MosaicItem[] {
  const agents = Array.from({ length: Math.max(1, count - 2) }, (_, index): MosaicItem => ({
    key: `agent-${index}`, type: 'agent', preferredAspect: 1.35,
    preferredWidth: 360, preferredHeight: 230, minAspect: 0.75, maxAspect: 2.2,
    weight: 1, minWidth: 300, minHeight: 150,
    variants: [
      { minWidth: 300, minHeight: 150, minAspect: 0.75, maxAspect: 2.2 },
      { minWidth: 300, minHeight: 150, minAspect: 0.55, maxAspect: 3.5 },
    ],
  }))
  return [pgm, telemetry, ...agents]
}

function overlaps(a: { row: number; column: number; rows: number; columns: number }, b: typeof a): boolean {
  return a.column < b.column + b.columns && a.column + a.columns > b.column
    && a.row < b.row + b.rows && a.row + a.rows > b.row
}

describe('responsive mosaic', () => {
  it.each([
    [390, 844],
    [567, 786],
    [1024, 768],
    [1440, 900],
    [2560, 900],
  ])('packs a feasible, non-overlapping wall at %d x %d', (width, height) => {
    let count = targetViewportCapacity(width, height)
    let items = fixtures(count)
    let packed = packMosaic(items, width, height)
    while ((!packed.feasible || violationsFor(items, packed.rects, width, height).length) && count > 3) {
      count -= 1
      items = fixtures(count)
      packed = packMosaic(items, width, height)
    }

    expect(packed.feasible).toBe(true)
    expect(violationsFor(items, packed.rects, width, height)).toEqual([])
    const rects = [...packed.rects.values()]
    for (let left = 0; left < rects.length; left += 1) {
      for (let right = left + 1; right < rects.length; right += 1) {
        expect(overlaps(rects[left]!, rects[right]!)).toBe(false)
      }
    }
    const pgmSize = dimensionsFor(packed.rects.get('pgm')!, width, height)
    expect(pgmSize.width).toBeLessThanOrEqual(1070)
    expect(pgmSize.width).toBeGreaterThanOrEqual(300)
  })

  it('grows capacity with available viewport area', () => {
    const capacities = [
      targetViewportCapacity(390, 844),
      targetViewportCapacity(1024, 768),
      targetViewportCapacity(1440, 900),
      targetViewportCapacity(2560, 1440),
      targetViewportCapacity(8000, 2400),
    ]
    expect(capacities).toEqual(capacities.toSorted((a, b) => a - b))
    expect(capacities.at(-1)).toBeGreaterThan(100)
  })
})
