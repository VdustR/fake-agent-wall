/** Own playback, session availability, and the fresh idle interval after exit. */
export function createPlaybackPolicy({ now = () => performance.now() } = {}) {
  let playing = false
  let idleSince = -Infinity
  const sessionBlocks = new Set()

  function isSessionActive() {
    return sessionBlocks.size === 0
  }

  return {
    start: () => { playing = true },
    stop: () => {
      if (playing) idleSince = now()
      playing = false
    },
    isPlaying: () => playing,
    isSessionActive,
    setSessionBlocked(reason, blocked) {
      const wasActive = isSessionActive()
      if (blocked) sessionBlocks.add(reason)
      else sessionBlocks.delete(reason)
      if (!wasActive && isSessionActive()) idleSince = now()
    },
    idleSeconds: systemIdle => Math.min(systemIdle, (now() - idleSince) / 1000),
  }
}
