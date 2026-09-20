import { describe, expect, it, vi } from 'vitest'
import { createFocusGuard } from './focus-guard.js'

function wall() {
  return {
    focus: vi.fn(),
    isDestroyed: vi.fn(() => false),
    moveTop: vi.fn(),
    show: vi.fn(),
  }
}

describe('wall focus guard', () => {
  it('raises and focuses the preferred wall', () => {
    const target = wall()
    const focusApplication = vi.fn()
    const guard = createFocusGuard({
      active: () => true,
      preferredWindow: () => target,
      focusApplication,
    })

    expect(guard.focusNow()).toBe(true)
    expect(focusApplication).toHaveBeenCalledOnce()
    expect(target.show).toHaveBeenCalledOnce()
    expect(target.moveTop).toHaveBeenCalledOnce()
    expect(target.focus).toHaveBeenCalledOnce()
  })

  it('coalesces blur events into one delayed recovery', () => {
    const target = wall()
    const callbacks = []
    const schedule = vi.fn(callback => {
      callbacks.push(callback)
      return callbacks.length
    })
    const guard = createFocusGuard({
      active: () => true,
      preferredWindow: () => target,
      schedule,
    })

    guard.recoverSoon()
    guard.recoverSoon()
    expect(schedule).toHaveBeenCalledOnce()

    callbacks[0]()
    expect(target.focus).toHaveBeenCalledOnce()
  })

  it('does not recover focus after playback stops', () => {
    const target = wall()
    const callbacks = []
    let playing = true
    const guard = createFocusGuard({
      active: () => playing,
      preferredWindow: () => target,
      schedule: callback => {
        callbacks.push(callback)
        return callbacks.length
      },
    })

    guard.recoverSoon()
    playing = false
    callbacks[0]()
    expect(target.focus).not.toHaveBeenCalled()
  })

  it('ignores a destroyed preferred wall', () => {
    const target = wall()
    target.isDestroyed.mockReturnValue(true)
    const guard = createFocusGuard({
      active: () => true,
      preferredWindow: () => target,
    })

    expect(guard.focusNow()).toBe(false)
    expect(target.focus).not.toHaveBeenCalled()
  })
})
