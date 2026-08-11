/** Deterministic 32-bit PRNG. One instance per agent keeps streams independent. */
export function mulberry32(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export type Rand = () => number

export const pick = <T,>(r: Rand, xs: readonly T[]): T => xs[Math.floor(r() * xs.length)] as T

export const range = (r: Rand, lo: number, hi: number): number => lo + r() * (hi - lo)

export const int = (r: Rand, lo: number, hi: number): number => Math.floor(range(r, lo, hi + 1))

export const chance = (r: Rand, p: number): boolean => r() < p

/** Pick `n` distinct members, order preserved from the source list. */
export function sample<T>(r: Rand, xs: readonly T[], n: number): T[] {
  const idx = xs.map((_, i) => i)
  for (let i = idx.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1))
    ;[idx[i], idx[j]] = [idx[j] as number, idx[i] as number]
  }
  return idx
    .slice(0, Math.min(n, xs.length))
    .toSorted((a, b) => a - b)
    .map((i) => xs[i] as T)
}
