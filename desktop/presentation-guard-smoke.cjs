// Run with Electron on macOS. This verifies real AppKit state, not physical keys.
/* eslint-disable no-await-in-loop -- Native window transitions must complete in order. */
const { app, BrowserWindow, screen } = require('electron')
const assert = require('node:assert/strict')
const { join } = require('node:path')
const native = require(join(__dirname, 'bin', 'presentation-guard.node'))
// Keep the default Electron runner alive between asynchronous fixture cycles.
app.on('window-all-closed', () => {})

async function waitForVisibility(window, expected) {
  const deadline = performance.now() + 2000
  while (performance.now() < deadline) {
    if (native.getWindowState(window.getNativeWindowHandle()).visible === expected) return
    await new Promise(resolve => setTimeout(resolve, 50))
  }
  assert.equal(native.getWindowState(window.getNativeWindowHandle()).visible, expected)
}

app.whenReady().then(async () => {
  try {
    const baseline = native.getOptions()
    for (let cycle = 0; cycle < 2; cycle++) {
      const wall = new BrowserWindow({ show: false, frame: false })
      const state = native.getWindowState(wall.getNativeWindowHandle())
      assert.equal(state.visible, false, 'hidden windows are not visible in AppKit')
      assert.equal(state.focused, false, 'hidden windows are not key windows')
      assert.equal(typeof state.foreground, 'boolean', 'reads actual application foreground state')
      wall.setSimpleFullScreen(true)
      const fullscreen = native.getOptions()
      assert.equal(fullscreen & (32 | 256), 0, 'fullscreen alone does not impose foreground restrictions')
      native.setEnabled(true)
      native.setEnabled(true)
      const guarded = native.getOptions()
      assert.equal(guarded & (32 | 256), 32 | 256, 'switching and hiding are disabled')
      assert.equal(guarded & (16 | 64 | 128), 0, 'Apple menu, force quit, and session termination remain enabled')
      native.setEnabled(false)
      native.setEnabled(false)
      assert.equal(native.getOptions(), fullscreen, 'restores fullscreen state before teardown')
      // Simulate release/reacquisition around a lock/unlock cycle.
      native.setEnabled(true)
      native.setEnabled(false)
      wall.setSimpleFullScreen(false)
      wall.destroy()
      assert.equal(native.getOptions(), baseline, 'restores desktop state after teardown')
    }
    assert.throws(() => native.setEnabled('true'), TypeError)
    assert.throws(() => native.getWindowState('invalid'), TypeError)
    assert.throws(() => native.getWindowState(Buffer.alloc(0)), TypeError)
    const bounds = screen.getPrimaryDisplay().bounds
    const wall = new BrowserWindow({ ...bounds, show: false, frame: false })
    wall.setSimpleFullScreen(true)
    wall.setAlwaysOnTop(true, 'screen-saver')
    await wall.loadURL('data:text/html,<h1>Native visibility smoke</h1>')
    app.focus({ steal: true })
    wall.show()
    wall.focus()
    await waitForVisibility(wall, true)
    for (const fullSize of [false, true]) {
      const cover = new BrowserWindow({ ...bounds, ...(fullSize ? {} : { width: 160, height: 100 }), show: false, frame: false })
      if (fullSize) cover.setSimpleFullScreen(true)
      cover.setAlwaysOnTop(true, 'screen-saver', 100)
      await cover.loadURL('data:text/html,<h1>Native cover fixture</h1>')
      cover.showInactive()
      await waitForVisibility(wall, !fullSize)
      if (fullSize) cover.setSimpleFullScreen(false)
      cover.destroy()
      await waitForVisibility(wall, true)
    }
    wall.setSimpleFullScreen(false)
    wall.destroy()
    assert.equal(native.getOptions(), baseline, 'visibility fixtures restore desktop presentation')
    console.log('Native presentation smoke passed: flags, restoration, full coverage, and partial overlays')
    app.exit(0)
  } catch (error) {
    native.setEnabled(false)
    console.error(error)
    app.exit(1)
  }
})
