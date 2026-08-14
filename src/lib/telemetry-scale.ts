export const TOKENS_PER_SOURCE_FULL_SCALE = 7_200
export const TOOLS_PER_SOURCE_FULL_SCALE = 24

export function throughputFullScale(sourceCount: number, perSourceScale: number): number {
  return Math.max(1, sourceCount) * perSourceScale
}

export function normalizeThroughput(value: number, fullScale: number): number {
  return Math.max(0, Math.min(1, value / fullScale))
}
