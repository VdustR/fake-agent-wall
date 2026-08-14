import { describe, expect, it } from 'vitest'
import {
  normalizeThroughput,
  throughputFullScale,
  TOKENS_PER_SOURCE_FULL_SCALE,
  TOOLS_PER_SOURCE_FULL_SCALE,
} from './telemetry-scale'

describe('telemetry throughput scale', () => {
  it('keeps representative 26-source traffic below full scale', () => {
    const sourceCount = 26

    expect(normalizeThroughput(
      148_000,
      throughputFullScale(sourceCount, TOKENS_PER_SOURCE_FULL_SCALE),
    )).toBeCloseTo(0.79, 2)
    expect(normalizeThroughput(
      390,
      throughputFullScale(sourceCount, TOOLS_PER_SOURCE_FULL_SCALE),
    )).toBeCloseTo(0.625, 3)
  })

  it('preserves the same load when the fleet and traffic grow together', () => {
    const smallScale = throughputFullScale(26, TOKENS_PER_SOURCE_FULL_SCALE)
    const largeScale = throughputFullScale(52, TOKENS_PER_SOURCE_FULL_SCALE)

    expect(normalizeThroughput(smallScale * 0.72, smallScale)).toBeCloseTo(0.72)
    expect(normalizeThroughput(largeScale * 0.72, largeScale)).toBeCloseTo(0.72)
  })

  it('clamps empty and overloaded readings to the printed meter', () => {
    expect(normalizeThroughput(-1, 100)).toBe(0)
    expect(normalizeThroughput(140, 100)).toBe(1)
  })
})
