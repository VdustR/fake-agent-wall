import { describe, expect, it, vi } from 'vitest'
import { EventEmitter } from 'node:events'
import { createFocusGuard, observeSessionFocus } from './focus-guard.js'
import { createPlaybackPolicy } from './playback-policy.js'

const front = { foreground: true, visible: true, focused: true }
const background = { foreground: false, visible: true, focused: false }
const occluded = { foreground: true, visible: false, focused: true }

function fixture(source = 'manual') {
  let time = 0
  const policy = createPlaybackPolicy({ now: () => time })
  policy.start(source)
  return { policy, at: value => { time = value } }
}

describe('macOS playback foreground policy', () => {
  it('owns playback without clearing session blocks when playback stops', () => {
    const policy = createPlaybackPolicy()
    expect(policy.isPlaying()).toBe(false)
    policy.setSessionBlocked('locked', true)
    policy.start()
    expect(policy.isPlaying()).toBe(true)
    expect(policy.shouldRecover()).toBe(false)
    policy.stop()
    expect(policy.isPlaying()).toBe(false)
    expect(policy.isSessionActive()).toBe(false)
    policy.setSessionBlocked('locked', false)
    expect(policy.isSessionActive()).toBe(true)
    expect(policy.shouldRecover()).toBe(false)
  })

  it('keeps independent session blocks until the final reason clears', () => {
    const { policy, at } = fixture()
    policy.update(front)
    for (const reason of ['locked', 'sleeping', 'inactive-session']) policy.setSessionBlocked(reason, true)
    at(2000)
    for (const reason of ['sleeping', 'locked']) {
      policy.setSessionBlocked(reason, false)
      expect(policy.isSessionActive()).toBe(false)
      expect(policy.shouldGuard()).toBe(false)
      expect(policy.shouldRecover()).toBe(false)
    }
    policy.setSessionBlocked('inactive-session', false)
    expect(policy.isSessionActive()).toBe(true)
    policy.update(background)
    at(2999)
    expect(policy.shouldRecover()).toBe(true)
    at(3000)
    expect(policy.shouldRecover()).toBe(false)
  })

  it.each(['idle', 'manual'])('restricts %s playback only while a visible wall has foreground input focus', source => {
    const { policy, at } = fixture(source)
    expect(policy.shouldGuard()).toBe(false)
    policy.update(front)
    expect(policy.shouldGuard()).toBe(true)
    expect(policy.shouldAcceptInput()).toBe(true)
    at(1500)
    for (const state of [background, occluded, { ...front, focused: false }]) {
      policy.update(state)
      expect(policy.shouldGuard()).toBe(false)
      expect(policy.shouldAcceptInput()).toBe(false)
    }
    policy.update(front)
    expect(policy.shouldGuard()).toBe(true)
  })

  it('suspends manual focus recovery in the background and resumes on return', () => {
    const { policy, at } = fixture()
    at(1500)
    expect(policy.update(background)).toBe(false)
    expect(policy.shouldRecover()).toBe(false)
    at(10000)
    expect(policy.update(occluded)).toBe(false)
    expect(policy.shouldRecover()).toBe(false)
    policy.update({ ...front, focused: false })
    expect(policy.shouldRecover()).toBe(true)
    expect(policy.shouldGuard()).toBe(false)
    policy.update(front)
    expect(policy.shouldGuard()).toBe(true)
  })

  it.each([background, occluded])('yields idle playback and waits a complete idle interval again: %j', state => {
    const { policy, at } = fixture('idle')
    policy.update(front)
    at(1500)
    expect(policy.update(state)).toBe(false)
    expect(policy.shouldGuard()).toBe(false)
    expect(policy.shouldRecover()).toBe(false)
    at(1800)
    expect(policy.update(state)).toBe(true)
    policy.stop()
    expect(policy.shouldRecover()).toBe(false)
    expect(policy.shouldGuard()).toBe(false)
    expect(policy.idleSeconds(600)).toBe(0)
    at(61800)
    expect(policy.idleSeconds(600)).toBe(60)
    expect(policy.idleSeconds(2)).toBe(2)
  })

  it('does not stop for a short foreground interruption', () => {
    const { policy, at } = fixture('idle')
    at(1500)
    expect(policy.update(background)).toBe(false)
    at(1700)
    expect(policy.update(front)).toBe(false)
    at(2000)
    expect(policy.update(background)).toBe(false)
    at(2200)
    expect(policy.update(front)).toBe(false)
  })

  it('allows bounded startup recovery without restricting a background player', () => {
    const { policy, at } = fixture('idle')
    expect(policy.shouldRecover()).toBe(true)
    at(999)
    expect(policy.update(background)).toBe(false)
    expect(policy.shouldGuard()).toBe(false)
    at(1000)
    expect(policy.update(background)).toBe(false)
    expect(policy.shouldRecover()).toBe(false)
    at(1300)
    expect(policy.update(background)).toBe(true)
  })

  it.each(['idle', 'manual'])('preserves %s playback across lock, lid sleep, and unlock', source => {
    const { policy, at } = fixture(source)
    policy.update(front)
    at(2000)
    policy.setSessionBlocked('locked', true)
    at(30000)
    expect(policy.update(background)).toBe(false)
    expect(policy.shouldGuard()).toBe(false)
    expect(policy.shouldRecover()).toBe(false)
    policy.setSessionBlocked('locked', false)
    expect(policy.shouldRecover()).toBe(true)
    expect(policy.shouldGuard()).toBe(false)
    at(30100)
    policy.update(front)
    expect(policy.shouldGuard()).toBe(true)
    // A delayed resume notification must not grant another recovery interval.
    at(32000)
    policy.setSessionBlocked('locked', false)
    policy.update(background)
    expect(policy.shouldRecover()).toBe(false)
  })

  it('schedules unlock recovery after the authoritative session state has unblocked', () => {
    const { policy, at } = fixture()
    const powerMonitor = new EventEmitter()
    const target = { show: vi.fn(), focus: vi.fn() }
    const scheduled = []
    const guard = createFocusGuard({
      active: () => policy.shouldRecover(),
      preferredWindow: () => target,
      schedule: callback => { scheduled.push(callback); return scheduled.length },
      cancel: vi.fn(),
    })
    const stop = observeSessionFocus(powerMonitor, policy, vi.fn(), () => {
      policy.update(background)
      if (policy.isSessionActive()) guard.recoverSoon()
      else guard.cancelRecovery()
    })
    at(2000)
    powerMonitor.emit('suspend')
    powerMonitor.emit('lock-screen')
    at(30000)
    powerMonitor.emit('unlock-screen')
    expect(scheduled).toHaveLength(1)
    scheduled[0]()
    expect(target.focus).toHaveBeenCalledOnce()
    stop()
  })

  it('does not use the grace interval to keep restrictions during sleep', () => {
    const { policy } = fixture()
    policy.update(front)
    policy.setSessionBlocked('locked', true)
    expect(policy.shouldGuard()).toBe(false)
    expect(policy.shouldRecover()).toBe(false)
  })
})
