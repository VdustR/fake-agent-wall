export const ACTIVITY_GUARD_DEFAULTS = {
  deferWhileAudioPlaying: false,
  deferWhileCameraInUse: true,
  deferWhileFullScreen: true,
}

export function shouldDeferIdleStart(settings, activity) {
  return (
    (settings.deferWhileAudioPlaying && activity.audioPlaying) ||
    (settings.deferWhileCameraInUse && activity.cameraInUse) ||
    (settings.deferWhileFullScreen && activity.fullScreen)
  )
}
