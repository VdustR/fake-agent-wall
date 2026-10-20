import { describe, expect, it } from 'vitest'
import { createPlaybackPolicy } from './playback-policy.js'

describe('playback and session ownership', () => {
  it('waits a full interval after any exit without extending it on repeated cleanup', () => {
    let time = 0
    const policy = createPlaybackPolicy({ now: () => time })
    expect(policy.idleSeconds(600)).toBe(600)
    policy.start()
    time = 2000
    policy.stop()
    expect(policy.isPlaying()).toBe(false)
    expect(policy.idleSeconds(600)).toBe(0)
    time = 32000
    policy.stop()
    expect(policy.idleSeconds(600)).toBe(30)
    time = 62000
    expect(policy.idleSeconds(600)).toBe(60)
    expect(policy.idleSeconds(2)).toBe(2)
  })

  it('keeps overlapping session blockers and resets idle only after the last clears', () => {
    let time = 0
    const policy = createPlaybackPolicy({ now: () => time })
    policy.setSessionBlocked('locked', true)
    policy.setSessionBlocked('sleeping', true)
    policy.setSessionBlocked('inactive-session', true)
    policy.stop()
    time = 30000
    policy.setSessionBlocked('locked', false)
    policy.setSessionBlocked('sleeping', false)
    expect(policy.isSessionActive()).toBe(false)
    policy.setSessionBlocked('inactive-session', false)
    expect(policy.isSessionActive()).toBe(true)
    expect(policy.idleSeconds(600)).toBe(0)
    time = 31000
    policy.setSessionBlocked('sleeping', false)
    expect(policy.idleSeconds(600)).toBe(1)
  })
})
