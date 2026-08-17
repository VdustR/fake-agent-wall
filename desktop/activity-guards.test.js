import { describe, expect, it } from 'vitest'
import { ACTIVITY_GUARD_DEFAULTS, shouldDeferIdleStart } from './activity-guards.js'

const inactive = { audioPlaying: false, cameraInUse: false, fullScreen: false }

describe('idle activity guards', () => {
  it('starts when no enabled activity is present', () => {
    expect(shouldDeferIdleStart(ACTIVITY_GUARD_DEFAULTS, inactive)).toBe(false)
  })

  it('ignores audio by default so music can keep playing behind the wall', () => {
    expect(shouldDeferIdleStart(ACTIVITY_GUARD_DEFAULTS, { ...inactive, audioPlaying: true })).toBe(false)
  })

  it.each([
    ['camera', { cameraInUse: true }],
    ['full-screen app', { fullScreen: true }],
  ])('defers for %s by default', (_label, activity) => {
    expect(shouldDeferIdleStart(ACTIVITY_GUARD_DEFAULTS, { ...inactive, ...activity })).toBe(true)
  })

  it('honours each independent opt-out', () => {
    const settings = {
      deferWhileAudioPlaying: false,
      deferWhileCameraInUse: false,
      deferWhileFullScreen: false,
    }
    const allActive = { audioPlaying: true, cameraInUse: true, fullScreen: true }
    expect(shouldDeferIdleStart(settings, allActive)).toBe(false)
  })

  it('can opt into deferring while audio is playing', () => {
    const settings = { ...ACTIVITY_GUARD_DEFAULTS, deferWhileAudioPlaying: true }
    expect(shouldDeferIdleStart(settings, { ...inactive, audioPlaying: true })).toBe(true)
  })
})
