/** Register after Electron is ready; lock, sleep, and login changes can overlap. */
export function observeSessionState(powerMonitor, policy, changed) {
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
      // Real lid wake can deliver unlock before a delayed resume notification.
      if (event === 'unlock-screen') policy.setSessionBlocked('sleeping', false)
      policy.setSessionBlocked(reason, blocked)
      changed()
    }
    powerMonitor.on(event, listener)
    return [event, listener]
  })
  return () => {
    for (const [event, listener] of listeners) powerMonitor.removeListener(event, listener)
  }
}
