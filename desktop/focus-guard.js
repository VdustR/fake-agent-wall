/** Schedule focus actions only while the caller's current policy permits them. */
export function createFocusGuard({
  active,
  preferredWindow,
  activateApp = () => {},
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
    wall.show()
    wall.moveTop?.()
    // A visible macOS window can belong to an inactive application after unlock.
    // Restore the application before asking its preferred window to take input.
    activateApp()
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

/** Register after Electron is ready. Screen lock and sleep can overlap. */
export function observeSessionFocus(powerMonitor, policy, cancelInput, sessionChanged) {
  const events = [
    ['lock-screen', 'locked', true],
    ['unlock-screen', 'locked', false],
    ['suspend', 'sleeping', true],
    ['resume', 'sleeping', false],
    ['user-did-resign-active', 'inactive-session', true],
    ['user-did-become-active', 'inactive-session', false],
  ]
  const listeners = events.map(([event, reason, blocked]) => {
    const listener = () => {
      if (blocked) cancelInput()
      // A real lid-open trace delivered unlock 28 seconds before resume.
      // Authentication has completed and the machine is awake at unlock;
      // waiting for its stale sleep block would leave the visible wall inert.
      if (event === 'unlock-screen') policy.setSessionBlocked('sleeping', false)
      policy.setSessionBlocked(reason, blocked)
      sessionChanged()
    }
    powerMonitor.on(event, listener)
    return [event, listener]
  })
  return () => {
    for (const [event, listener] of listeners) powerMonitor.removeListener(event, listener)
  }
}
