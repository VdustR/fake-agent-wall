import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { observePointerIdle, POINTER_IDLE_MS } from './pointer-idle'

beforeEach(() => vi.useFakeTimers())
afterEach(() => vi.useRealTimers())

it('starts visible, hides after idle, and shows on the first movement', () => {
  const target = new EventTarget()
  const change = vi.fn()
  const stop = observePointerIdle(target, change)
  expect(change).toHaveBeenLastCalledWith(false)
  vi.advanceTimersByTime(POINTER_IDLE_MS - 1)
  expect(change).toHaveBeenCalledTimes(1)
  vi.advanceTimersByTime(1)
  expect(change).toHaveBeenLastCalledWith(true)
  target.dispatchEvent(new Event('pointermove'))
  expect(change).toHaveBeenLastCalledWith(false)
  stop()
})

it('restarts the full idle interval on every movement with only one timer', () => {
  const target = new EventTarget()
  const change = vi.fn()
  const stop = observePointerIdle(target, change)
  for (let i = 0; i < 10; i++) {
    vi.advanceTimersByTime(POINTER_IDLE_MS - 1)
    target.dispatchEvent(new Event('pointermove'))
    expect(change).toHaveBeenLastCalledWith(false)
    expect(vi.getTimerCount()).toBe(1)
  }
  vi.advanceTimersByTime(POINTER_IDLE_MS)
  expect(change).toHaveBeenLastCalledWith(true)
  stop()
})

it('removes the pending timer and listener before remounting', () => {
  const target = new EventTarget()
  const previous = vi.fn()
  const stop = observePointerIdle(target, previous)
  stop()
  expect(vi.getTimerCount()).toBe(0)
  target.dispatchEvent(new Event('pointermove'))
  vi.advanceTimersByTime(POINTER_IDLE_MS)
  expect(previous).toHaveBeenCalledTimes(1)

  const next = vi.fn()
  const stopNext = observePointerIdle(target, next)
  target.dispatchEvent(new Event('pointermove'))
  expect(next).toHaveBeenCalledTimes(2)
  expect(previous).toHaveBeenCalledTimes(1)
  vi.advanceTimersByTime(POINTER_IDLE_MS)
  expect(next).toHaveBeenLastCalledWith(true)
  stopNext()
  expect(vi.getTimerCount()).toBe(0)
})
