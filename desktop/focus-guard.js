export function createFocusGuard({
  active,
  preferredWindow,
  focusApplication = () => {},
  schedule = setTimeout,
  cancel = clearTimeout,
  delayMs = 75,
}) {
  let recoveryTimer = null

  function cancelRecovery() {
    if (recoveryTimer === null) return
    cancel(recoveryTimer)
    recoveryTimer = null
  }

  function focusNow() {
    cancelRecovery()
    if (!active()) return false
    const wall = preferredWindow()
    if (!wall || wall.isDestroyed?.()) return false
    focusApplication()
    wall.show()
    wall.moveTop?.()
    wall.focus()
    return true
  }

  function recoverSoon() {
    if (!active() || recoveryTimer !== null) return
    recoveryTimer = schedule(() => {
      recoveryTimer = null
      focusNow()
    }, delayMs)
  }

  return { cancelRecovery, focusNow, recoverSoon }
}
