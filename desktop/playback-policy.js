/** macOS foreground policy. Native samples remain independent of Chromium visibility. */
export function createPlaybackPolicy({ now = () => performance.now(), recoveryMs = 1000, yieldMs = 300 } = {}) {
  let source = null
  let sessionActive = true
  let recoveryUntil = 0
  let backgroundSince = null
  let sample = { foreground: false, visible: false, focused: false }
  let lastYield = -Infinity

  function start(origin = 'manual') {
    source = origin
    recoveryUntil = now() + recoveryMs
    backgroundSince = null
    sample = { foreground: false, visible: false, focused: false }
  }

  function stop() {
    source = null
    backgroundSince = null
  }

  function setSessionActive(active) {
    if (active && !sessionActive) recoveryUntil = now() + recoveryMs
    sessionActive = active
    backgroundSince = null
  }

  function update(next) {
    sample = next
    // Once startup/unlock succeeds, a later takeover is a real background
    // transition and must not inherit permission to steal focus back.
    if (source && sessionActive && sample.foreground && sample.visible && sample.focused) recoveryUntil = 0
    const background = !sample.foreground || !sample.visible
    if (!source || !sessionActive || !background || now() < recoveryUntil) {
      backgroundSince = null
      return false
    }
    backgroundSince ??= now()
    if (source !== 'idle' || now() - backgroundSince < yieldMs) return false
    lastYield = now()
    return true
  }

  function shouldAcceptInput() {
    return Boolean(source && sessionActive && sample.foreground && sample.visible && sample.focused)
  }

  return {
    start,
    stop,
    setSessionActive,
    requestRecovery: () => { recoveryUntil = now() + recoveryMs },
    update,
    // A background window must never restrict the application the operator sees.
    shouldGuard: () => source === 'manual' && shouldAcceptInput(),
    shouldAcceptInput,
    // Allow startup/unlock recovery, or recovery within this app. Never fight
    // another foreground app after the bounded startup/unlock interval.
    shouldRecover: () => Boolean(source && sessionActive && (
      now() < recoveryUntil || (sample.foreground && sample.visible)
    )),
    idleSeconds: systemIdle => Math.min(systemIdle, (now() - lastYield) / 1000),
  }
}
