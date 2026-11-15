import type { Rand } from './rng'
import type { ToolDescriptor, ToolProfile } from './tool-workload'

/** Authored synthetic work times: warm minimum, ordinary maximum, long tail. */
const RUNTIMES: Partial<Record<ToolProfile, readonly [number, number, number]>> = {
  build: [8000, 45000, 120000],
  rust: [12000, 70000, 180000],
  go: [6000, 35000, 90000],
  docker: [15000, 65000, 180000],
  test: [8000, 35000, 90000],
  'test-single': [3000, 12000, 30000],
  check: [3000, 12000, 30000],
  install: [6000, 25000, 75000],
  publish: [3000, 12000, 40000],
}

export function toolRuntimeMs(tool: ToolDescriptor, random: Rand): number {
  const bounds = RUNTIMES[tool.profile]
  if (!bounds) return 0
  const [minimum, ordinary, tail] = bounds
  const draw = random()
  // Most work has a useful dwell, some runs are warm, a few take much longer.
  if (draw < .2) return Math.round(minimum * (1 + .5 * draw / .2))
  if (draw < .9) return Math.round(minimum + (ordinary - minimum) * (draw - .2) / .7)
  return Math.round(ordinary + (tail - ordinary) * (draw - .9) / .1)
}
