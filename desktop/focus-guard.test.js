import { EventEmitter } from 'node:events'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { createFocusGuard, observeSessionFocus } from './focus-guard.js'
import { createPlaybackPolicy } from './playback-policy.js'

afterEach(() => vi.useRealTimers())

function wall() {
  return {
    focus: vi.fn(),
    isDestroyed: vi.fn(() => false),
    moveTop: vi.fn(),
    show: vi.fn(),
  }
}

describe('wall focus guard', () => {
  it('notifies once after a complete session event and removes its observers', () => {
    const powerMonitor = new EventEmitter()
    const policy = createPlaybackPolicy()
    const states = []
    const stop = observeSessionFocus(powerMonitor, policy, vi.fn(), () => states.push(policy.isSessionActive()))
    for (const event of ['lock-screen', 'suspend', 'unlock-screen', 'resume']) powerMonitor.emit(event)
    expect(states).toEqual([false, false, true, true])
    stop()
    powerMonitor.emit('lock-screen')
    expect(states).toHaveLength(4)
  })
  it('raises and focuses the preferred wall', () => {
    const target = wall()
    const guard = createFocusGuard({
      active: () => true,
      preferredWindow: () => target,
    })

    expect(guard.focusNow()).toBe(true)
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

  it('activates the application before focusing an inactive window', () => {
    let appActive = false
    let focused = false
    const target = wall()
    target.focus.mockImplementation(() => { focused = appActive })
    const guard = createFocusGuard({
      active: () => true,
      preferredWindow: () => target,
      activateApp: () => { appActive = true },
    })

    expect(guard.focusNow()).toBe(true)
    expect(focused).toBe(true)
  })

  it('does not activate the application when playback is inactive or its window is destroyed', () => {
    const activateApp = vi.fn()
    let playing = false
    const target = wall()
    const guard = createFocusGuard({ active: () => playing, preferredWindow: () => target, activateApp })
    expect(guard.focusNow()).toBe(false)
    playing = true
    target.isDestroyed.mockReturnValue(true)
    expect(guard.focusNow()).toBe(false)
    expect(activateApp).not.toHaveBeenCalled()
  })

  it('cancels delayed recovery explicitly', () => {
    vi.useFakeTimers()
    const target = wall()
    const guard = createFocusGuard({ active: () => true, preferredWindow: () => target })
    guard.recoverSoon()
    guard.cancelRecovery()
    vi.runAllTimers()
    expect(target.focus).not.toHaveBeenCalled()
  })
})
