export function wallWindowPresentation({ platform, windowed }) {
  if (windowed) return {}
  // macOS native fullscreen and kiosk create a separate Space. The caller
  // supplies exact display bounds and a frameless always-on-top window, which
  // provides full-screen coverage without changing the active Space.
  if (platform === 'darwin') return {}
  if (platform === 'win32') return { kiosk: true, skipTaskbar: true }
  return { fullscreen: true }
}

export function showWallWhenReady(wall, shouldFocus) {
  if (shouldFocus) {
    wall.show()
    wall.focus()
    return
  }
  wall.showInactive()
}
