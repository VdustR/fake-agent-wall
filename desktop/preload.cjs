// CommonJS on purpose: sandboxed preloads are not ES modules, and the package
// is "type": "module", so the .cjs extension is what keeps this loadable.
const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('swarmdeck', {
  isDesktop: true,
  /**
   * The main process owns the exit gesture and tells the page when to surface
   * the hint. The page never decides whether the app closes — if the renderer
   * wedges, double-tapping esc still works.
   */
  onHint(callback) {
    const handler = (_event, payload) => callback(payload)
    ipcRenderer.on('wall:hint', handler)
    return () => ipcRenderer.off('wall:hint', handler)
  },
})
