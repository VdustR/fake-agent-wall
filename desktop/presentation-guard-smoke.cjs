// Run with Electron on macOS. This verifies real AppKit state, not physical keys.
const { app, BrowserWindow } = require('electron')
const assert = require('node:assert/strict')
const { join } = require('node:path')
const native = require(join(__dirname, 'bin', 'presentation-guard.node'))

app.whenReady().then(() => {
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
    console.log('Native presentation smoke passed: flags, idempotence, reacquisition, and restoration')
    app.exit(0)
  } catch (error) {
    native.setEnabled(false)
    console.error(error)
    app.exit(1)
  }
})
