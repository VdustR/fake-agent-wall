// CommonJS on purpose: sandboxed preloads are not ES modules, and the package
// is "type": "module", so the .cjs extension is what keeps this loadable.
const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('agentWall', {
  isDesktop: true,
  /**
   * The main process owns the exit gesture and tells the page when to surface
   * the hint. The page never decides whether the app closes — if the renderer
   * wedges, holding esc still works.
   */
  onHint(callback) {
    const handler = (_event, payload) => callback(payload)
    ipcRenderer.on('wall:hint', handler)
    return () => ipcRenderer.off('wall:hint', handler)
  },
  onThemeToggle(callback) {
    const handler = () => callback()
    ipcRenderer.on('wall:theme-toggle', handler)
    return () => ipcRenderer.off('wall:theme-toggle', handler)
  },
  onThemeClose(callback) {
    const handler = () => callback()
    ipcRenderer.on('wall:theme-close', handler)
    return () => ipcRenderer.off('wall:theme-close', handler)
  },
  setThemePanelOpen(open) {
    ipcRenderer.send('wall:theme-panel', open)
  },
})
