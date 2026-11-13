import { expect, it } from 'vitest'
import { constrainHostTraffic, HOST_PROFILE } from './host-load'

const mbitsPerMiB = 8 * 1024 * 1024 / 1_000_000

it('propagates shared download limits into the writes caused by those downloads', () => {
  const jobs = [0, 1].map(() => ({ phase: 'fetch' as const, rx: 800, tx: 0, read: 0, write: 800 / mbitsPerMiB }))
  const traffic = constrainHostTraffic(jobs)
  expect(traffic.netRx).toBe(HOST_PROFILE.networkMbps)
  expect(traffic.diskWrite).toBeCloseTo(traffic.netRx / mbitsPerMiB, 8)
})

it('preserves full-duplex transmit and receive budgets independently', () => {
  const traffic = constrainHostTraffic([
    { phase: 'fetch', rx: 1600, tx: 0, read: 0, write: 1600 / mbitsPerMiB },
    { phase: 'publish', rx: 0, tx: 1600, read: 1600 / mbitsPerMiB, write: 0 },
  ])
  expect(traffic.netRx).toBe(1000)
  expect(traffic.netTx).toBe(1000)
  expect(traffic.diskRead).toBeCloseTo(1000 / mbitsPerMiB, 8)
  expect(traffic.diskWrite).toBeCloseTo(1000 / mbitsPerMiB, 8)
})

it('limits aggregate disk work without changing its read/write ratio', () => {
  const traffic = constrainHostTraffic([{ phase: 'compile', rx: 0, tx: 0, read: 1000, write: 600 }])
  expect(traffic.diskRead).toBe(500)
  expect(traffic.diskWrite).toBe(300)
  expect(constrainHostTraffic([])).toEqual({ netRx: 0, netTx: 0, diskRead: 0, diskWrite: 0 })
})
