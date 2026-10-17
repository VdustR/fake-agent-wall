export const ACTIVITY_GUARD_DEFAULTS = {
  deferWhileCameraInUse: true,
}

export function shouldDeferIdleStart(settings, activity) {
  return Boolean(settings.deferWhileCameraInUse && activity.cameraInUse)
}
