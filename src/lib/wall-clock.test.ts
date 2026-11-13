import { afterEach, expect, it, vi } from 'vitest'
import { formatLocalTime, observeWallClock } from './wall-clock'

afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals() })

it('formats local civil time with three millisecond digits across midnight', () => {
  const end = new Date(2026, 10, 13, 23, 59, 59, 999).getTime()
  expect(formatLocalTime(end)).toBe('23:59:59.999')
  expect(formatLocalTime(end + 1)).toBe('00:00:00.000')
  expect(formatLocalTime(new Date(2026, 0, 1, 1, 2, 3, 4).getTime())).toBe('01:02:03.004')
})

it('samples the system clock on paint, resyncs after visibility and stops cleanly', () => {
  const events = new EventTarget()
  const pageEvents = new EventTarget()
  const frames = new Map<number, FrameRequestCallback>()
  let next = 0
  const doc = { hidden: false, addEventListener: events.addEventListener.bind(events), removeEventListener: events.removeEventListener.bind(events) }
  vi.stubGlobal('document', doc)
  vi.stubGlobal('window', {
    requestAnimationFrame: (callback: FrameRequestCallback) => { frames.set(++next, callback); return next },
    cancelAnimationFrame: (id: number) => { frames.delete(id) },
    addEventListener: pageEvents.addEventListener.bind(pageEvents),
    removeEventListener: pageEvents.removeEventListener.bind(pageEvents),
  })
  const now = vi.spyOn(Date, 'now').mockReturnValue(10_000)
  const changed = vi.fn()
  const stop = observeWallClock(changed)
  expect(changed).toHaveBeenLastCalledWith(10_000)
  const paint = () => {
    const [id, callback] = [...frames][0]!
    frames.delete(id)
    callback(999)
  }
  now.mockReturnValue(8_123) // An OS clock correction must not follow the rAF timestamp.
  paint()
  expect(changed).toHaveBeenLastCalledWith(8_123)
  expect(frames.size).toBe(1)
  doc.hidden = true
  events.dispatchEvent(new Event('visibilitychange'))
  expect(frames.size).toBe(0)
  now.mockReturnValue(99_987)
  doc.hidden = false
  events.dispatchEvent(new Event('visibilitychange'))
  expect(changed).toHaveBeenLastCalledWith(99_987)
  pageEvents.dispatchEvent(new Event('pageshow'))
  expect(frames.size).toBe(1)
  stop()
  const count = changed.mock.calls.length
  events.dispatchEvent(new Event('visibilitychange'))
  pageEvents.dispatchEvent(new Event('pageshow'))
  expect(frames.size).toBe(0)
  expect(changed).toHaveBeenCalledTimes(count)
})
