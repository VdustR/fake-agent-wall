export function wallWindowPresentation({ windowed }) {
  return windowed ? {} : { fullscreen: true }
}

export function showWallWhenReady(wall, shouldFocus) {
  if (shouldFocus) wall.show()
  else wall.showInactive()
}
