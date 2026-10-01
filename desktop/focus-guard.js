export function createFocusGuard({
  active,
  preferredWindow,
  activateApp = () => {},
  schedule = setTimeout,
  cancel = clearTimeout,
  delayMs = 75,
}) {
  let recoveryTimer = null
  const sessionBlocks = new Set()

  function isSessionActive() {
    return sessionBlocks.size === 0
  }

  function cancelRecovery() {
    if (recoveryTimer === null) return
    cancel(recoveryTimer)
    recoveryTimer = null
  }

  function focusNow() {
    cancelRecovery()
    if (!active() || !isSessionActive()) return false
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
    if (!active() || !isSessionActive() || recoveryTimer !== null) return
    recoveryTimer = schedule(() => {
      recoveryTimer = null
      focusNow()
    }, delayMs)
  }

  function setSessionBlocked(reason, blocked) {
    if (blocked) {
      sessionBlocks.add(reason)
      cancelRecovery()
    } else {
      sessionBlocks.delete(reason)
      recoverSoon()
    }
  }

  return { cancelRecovery, focusNow, recoverSoon, isSessionActive, setSessionBlocked }
}

/** Register after Electron is ready. Screen lock and sleep can overlap. */
export function observeSessionFocus(powerMonitor, guard, cancelInput) {
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
      guard.setSessionBlocked(reason, blocked)
    }
    powerMonitor.on(event, listener)
    return [event, listener]
  })
  return () => {
    for (const [event, listener] of listeners) powerMonitor.removeListener(event, listener)
    guard.cancelRecovery()
  }
}
