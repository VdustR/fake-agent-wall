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
      wall.setSimpleFullScreen(true)
      const fullscreen = native.getOptions()
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
    console.log('Native presentation smoke passed: flags, idempotence, reacquisition, and restoration')
    app.exit(0)
  } catch (error) {
    native.setEnabled(false)
    console.error(error)
    app.exit(1)
  }
})
