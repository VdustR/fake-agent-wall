export function wallWindowPresentation({ platform, windowed }) {
  if (windowed) return {}
  if (platform === 'darwin') return { simpleFullscreen: true }
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
