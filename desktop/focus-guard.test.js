import { EventEmitter } from 'node:events'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { createFocusGuard, observeSessionFocus } from './focus-guard.js'

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
  it('updates presentation only after the combined session state changes', () => {
    vi.useFakeTimers()
    const powerMonitor = new EventEmitter()
    const guard = createFocusGuard({ active: () => true, preferredWindow: wall })
    const states = []
    const stop = observeSessionFocus(powerMonitor, guard, vi.fn(), () => states.push(guard.isSessionActive()))
    for (const event of ['lock-screen', 'suspend', 'unlock-screen', 'resume']) powerMonitor.emit(event)
    expect(states).toEqual([false, false, false, true])
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

  it('cancels a blur recovery and stale input while locked, then recovers without another blur', () => {
    vi.useFakeTimers()
    const target = wall()
    const powerMonitor = new EventEmitter()
    const cancelInput = vi.fn()
    const guard = createFocusGuard({ active: () => true, preferredWindow: () => target })
    const stop = observeSessionFocus(powerMonitor, guard, cancelInput)

    guard.recoverSoon()
    powerMonitor.emit('lock-screen')
    guard.recoverSoon()
    expect(guard.focusNow()).toBe(false)
    vi.runAllTimers()
    expect(target.focus).not.toHaveBeenCalled()
    expect(cancelInput).toHaveBeenCalledOnce()
    expect(guard.isSessionActive()).toBe(false)

    powerMonitor.emit('unlock-screen')
    expect(target.focus).not.toHaveBeenCalled()
    vi.runAllTimers()
    expect(target.focus).toHaveBeenCalledOnce()
    expect(guard.isSessionActive()).toBe(true)
    stop()
  })

  it.each([
    ['resume', 'unlock-screen'],
    ['unlock-screen', 'resume'],
  ])('waits for both sleep and lock to clear: %s then %s', (first, second) => {
    vi.useFakeTimers()
    const target = wall()
    const powerMonitor = new EventEmitter()
    const guard = createFocusGuard({ active: () => true, preferredWindow: () => target })
    const stop = observeSessionFocus(powerMonitor, guard, vi.fn())
    powerMonitor.emit('lock-screen')
    powerMonitor.emit('suspend')
    powerMonitor.emit(first)
    vi.runAllTimers()
    expect(target.focus).not.toHaveBeenCalled()
    powerMonitor.emit(second)
    vi.runAllTimers()
    expect(target.focus).toHaveBeenCalledOnce()
    stop()
  })

  it('waits for the login session to become active before recovering', () => {
    vi.useFakeTimers()
    const target = wall()
    const powerMonitor = new EventEmitter()
    const guard = createFocusGuard({ active: () => true, preferredWindow: () => target })
    const stop = observeSessionFocus(powerMonitor, guard, vi.fn())
    powerMonitor.emit('user-did-resign-active')
    powerMonitor.emit('lock-screen')
    powerMonitor.emit('unlock-screen')
    vi.runAllTimers()
    expect(target.focus).not.toHaveBeenCalled()
    powerMonitor.emit('user-did-become-active')
    vi.runAllTimers()
    expect(target.focus).toHaveBeenCalledOnce()
    stop()
  })

  it('coalesces resume events and rechecks playback before the delayed recovery', () => {
    vi.useFakeTimers()
    let playing = true
    const target = wall()
    const powerMonitor = new EventEmitter()
    const activateApp = vi.fn()
    const guard = createFocusGuard({ active: () => playing, preferredWindow: () => target, activateApp })
    const stop = observeSessionFocus(powerMonitor, guard, vi.fn())
    powerMonitor.emit('unlock-screen')
    powerMonitor.emit('resume')
    powerMonitor.emit('user-did-become-active')
    expect(vi.getTimerCount()).toBe(1)
    playing = false
    vi.runAllTimers()
    expect(activateApp).not.toHaveBeenCalled()
    expect(target.focus).not.toHaveBeenCalled()
    stop()
  })

  it('removes session observers and cancels pending recovery on shutdown', () => {
    vi.useFakeTimers()
    const target = wall()
    const powerMonitor = new EventEmitter()
    const guard = createFocusGuard({ active: () => true, preferredWindow: () => target })
    const stop = observeSessionFocus(powerMonitor, guard, vi.fn())
    powerMonitor.emit('unlock-screen')
    stop()
    expect(powerMonitor.eventNames()).toEqual([])
    vi.runAllTimers()
    expect(target.focus).not.toHaveBeenCalled()
  })
})
