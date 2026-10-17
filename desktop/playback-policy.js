/** Owns playback/session state and derives macOS foreground permissions. */
export function createPlaybackPolicy({ now = () => performance.now(), recoveryMs = 1000, yieldMs = 300 } = {}) {
  let source = null
  const sessionBlocks = new Set()
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

  function isSessionActive() {
    return sessionBlocks.size === 0
  }

  function setSessionBlocked(reason, blocked) {
    const wasActive = isSessionActive()
    if (blocked) sessionBlocks.add(reason)
    else sessionBlocks.delete(reason)
    if (!wasActive && isSessionActive()) recoveryUntil = now() + recoveryMs
    backgroundSince = null
  }

  function update(next) {
    sample = next
    // Once startup/unlock succeeds, a later takeover is a real background
    // transition and must not inherit permission to steal focus back.
    if (source && isSessionActive() && sample.foreground && sample.visible && sample.focused) recoveryUntil = 0
    const background = !sample.foreground || !sample.visible
    if (!source || !isSessionActive() || !background || now() < recoveryUntil) {
      backgroundSince = null
      return false
    }
    backgroundSince ??= now()
    if (source !== 'idle' || now() - backgroundSince < yieldMs) return false
    lastYield = now()
    return true
  }

  function shouldAcceptInput() {
    return Boolean(source && isSessionActive() && sample.foreground && sample.visible && sample.focused)
  }

  return {
    start,
    stop,
    isPlaying: () => source !== null,
    isSessionActive,
    setSessionBlocked,
    requestRecovery: () => { recoveryUntil = now() + recoveryMs },
    update,
    // A background window must never restrict the application the operator sees.
    shouldGuard: shouldAcceptInput,
    shouldAcceptInput,
    // Allow startup/unlock recovery, or recovery within this app. Never fight
    // another foreground app after the bounded startup/unlock interval.
    shouldRecover: () => Boolean(source && isSessionActive() && (
      now() < recoveryUntil || (sample.foreground && sample.visible)
    )),
    idleSeconds: systemIdle => Math.min(systemIdle, (now() - lastYield) / 1000),
  }
}
