import { EventEmitter } from 'node:events'
import { afterEach, expect, it, vi } from 'vitest'
import { createWindowRetirement } from './window-retirement.js'

afterEach(() => vi.useRealTimers())

function window() {
  const value = new EventEmitter()
  Object.assign(value, {
    isFullScreen: () => true,
    isDestroyed: () => value.destroy.mock.calls.length > 0,
    destroy: vi.fn(), setOpacity: vi.fn(), setFullScreen: vi.fn(),
  })
  return value
}

it('becomes transparent immediately and waits for native exit before deferred destruction', async () => {
  vi.useFakeTimers()
  const retirement = createWindowRetirement({ platform: 'darwin', windowed: false })
  const wall = window()
  const done = retirement.retire(wall)
  expect(wall.setOpacity).toHaveBeenCalledWith(0)
  expect(wall.setFullScreen).toHaveBeenCalledWith(false)
  expect(retirement.isPending()).toBe(true)
  expect(wall.destroy).not.toHaveBeenCalled()
  wall.emit('leave-full-screen')
  expect(wall.destroy).not.toHaveBeenCalled()
  await vi.advanceTimersByTimeAsync(0)
  expect(await done).toBe(true)
  expect(wall.destroy).toHaveBeenCalledOnce()
  expect(retirement.isPending()).toBe(false)
})

it('waits for a queued native exit even while the fullscreen style is still false', async () => {
  vi.useFakeTimers()
  const retirement = createWindowRetirement({ platform: 'darwin', windowed: false })
  const wall = window()
  wall.isFullScreen = () => false
  const done = retirement.retire(wall)
  expect(retirement.isPending()).toBe(true)
  expect(wall.destroy).not.toHaveBeenCalled()
  expect(wall.setFullScreen).toHaveBeenCalledWith(false)
  wall.emit('leave-full-screen')
  await vi.advanceTimersByTimeAsync(0)
  expect(await done).toBe(true)
})

it('fails closed when native exit never completes and releases pending state', async () => {
  vi.useFakeTimers()
  const retirement = createWindowRetirement({ platform: 'darwin', windowed: false })
  const wall = window()
  const done = retirement.retire(wall)
  await vi.advanceTimersByTimeAsync(5001)
  expect(await done).toBe(false)
  expect(wall.destroy).toHaveBeenCalledOnce()
  expect(retirement.isPending()).toBe(false)
  expect(wall.listenerCount('leave-full-screen')).toBe(0)
})

it.each(['win32', 'linux'])('keeps immediate teardown on %s', async platform => {
  const retirement = createWindowRetirement({ platform, windowed: false })
  const wall = window()
  expect(await retirement.retire(wall)).toBe(true)
  expect(wall.destroy).toHaveBeenCalledOnce()
  expect(wall.setOpacity).not.toHaveBeenCalled()
})
