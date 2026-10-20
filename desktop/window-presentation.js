export function wallWindowPresentation({ platform, windowed }) {
  // The macOS overlay uses display bounds and joins the current Space. Native
  // fullscreen would switch Spaces; simple fullscreen changes global UI state.
  if (windowed || platform === 'darwin') return {}
  return { fullscreen: true }
}

export function showWallWhenReady(wall, shouldFocus) {
  if (shouldFocus) wall.show()
  else wall.showInactive()
}
