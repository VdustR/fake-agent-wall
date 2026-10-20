import { EventEmitter } from 'node:events'
import { describe, expect, it } from 'vitest'
import { createPlaybackPolicy } from './playback-policy.js'
import { observeSessionState } from './session-events.js'

describe('session event observation', () => {
  it('handles unlock before delayed resume without restoring playback', () => {
    const power = new EventEmitter()
    const policy = createPlaybackPolicy()
    const states = []
    const stop = observeSessionState(power, policy, () => states.push(policy.isSessionActive()))
    power.emit('suspend')
    power.emit('lock-screen')
    power.emit('unlock-screen')
    power.emit('resume')
    expect(states).toEqual([false, false, true, true])
    expect(policy.isPlaying()).toBe(false)
    stop()
    expect(power.eventNames()).toEqual([])
  })

  it('keeps an inactive login session blocked after unlock', () => {
    const power = new EventEmitter()
    const policy = createPlaybackPolicy()
    const stop = observeSessionState(power, policy, () => {})
    power.emit('user-did-resign-active')
    power.emit('suspend')
    power.emit('unlock-screen')
    expect(policy.isSessionActive()).toBe(false)
    power.emit('user-did-become-active')
    expect(policy.isSessionActive()).toBe(true)
    stop()
  })
})
