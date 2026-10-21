/** Complete macOS native fullscreen teardown before another playback starts. */
export function createWindowRetirement({ platform, windowed, timeoutMs = 5000 }) {
  const pending = new Set()

  function retire(window) {
    if (platform !== 'darwin' || windowed) {
      window.destroy()
      return Promise.resolve(true)
    }

    let complete
    const result = new Promise(resolve => { complete = resolve })
    pending.add(result)
    let finished = false
    const finish = clean => {
      if (finished) return
      finished = true
      clearTimeout(timeout)
      window.removeListener('leave-full-screen', left)
      window.removeListener('closed', closed)
      // Electron's native fullscreen delegate still accesses the window after
      // emitting the event. Destroy it only after that callback has returned.
      setImmediate(() => {
        if (!window.isDestroyed()) window.destroy()
        pending.delete(result)
        complete(clean)
      })
    }
    const left = () => finish(true)
    const closed = () => finish(false)
    const timeout = setTimeout(() => finish(false), timeoutMs)
    window.once('leave-full-screen', left)
    window.once('closed', closed)
    // Hiding a fullscreen NSWindow can suppress its leave notification.
    // Make it visually absent without cancelling the native exit transition.
    window.setOpacity(0)
    // Electron queues this behind an in-flight enter transition even when
    // isFullScreen() still reports false. A missing exit fails closed.
    window.setFullScreen(false)
    return result
  }

  return {
    retire,
    isPending: () => pending.size > 0,
    wait: () => Promise.all(pending),
  }
}
