import { describe, expect, it } from 'vitest'
import { ACTIVITY_GUARD_DEFAULTS, shouldDeferIdleStart } from './activity-guards.js'

describe('idle camera guard', () => {
  it('starts when the camera is inactive', () => {
    expect(shouldDeferIdleStart(ACTIVITY_GUARD_DEFAULTS, { cameraInUse: false })).toBe(false)
  })

  it('defers while the camera is in use by default', () => {
    expect(shouldDeferIdleStart(ACTIVITY_GUARD_DEFAULTS, { cameraInUse: true })).toBe(true)
  })

  it('honours the camera opt-out', () => {
    expect(shouldDeferIdleStart({ deferWhileCameraInUse: false }, { cameraInUse: true })).toBe(false)
  })

  it('ignores obsolete audio and fullscreen settings even when enabled', () => {
    const legacySettings = {
      ...ACTIVITY_GUARD_DEFAULTS,
      deferWhileAudioPlaying: true,
      deferWhileFullScreen: true,
    }
    const legacyActivity = { audioPlaying: true, fullScreen: true, cameraInUse: false }
    expect(shouldDeferIdleStart(legacySettings, legacyActivity)).toBe(false)
  })
})
