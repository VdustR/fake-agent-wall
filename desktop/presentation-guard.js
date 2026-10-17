import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const require = createRequire(import.meta.url)
let native = null

function loadNative() {
  native ??= require(join(
    process.resourcesPath && !process.defaultApp
      ? process.resourcesPath
      : join(dirname(fileURLToPath(import.meta.url)), 'bin'),
    'presentation-guard.node',
  ))
  return native
}

export function setPresentationGuard(enabled) {
  if (process.platform !== 'darwin') return
  loadNative().setEnabled(enabled)
}

export function getWallForegroundState(windows) {
  const states = windows.filter(window => !window.isDestroyed())
    .map(window => loadNative().getWindowState(window.getNativeWindowHandle()))
  return {
    foreground: states.some(state => state.foreground),
    visible: states.some(state => state.visible),
    focused: states.some(state => state.focused && state.visible),
  }
}
