const { app, BrowserWindow } = require('electron')
const { writeFileSync, existsSync, unlinkSync } = require('node:fs')
const { join } = require('node:path')
const profile = process.env.ACTIVATOR_PROFILE
app.setPath('userData', profile)
app.whenReady().then(async () => {
  const window = new BrowserWindow({ width: 640, height: 480, show: false })
  await window.loadURL('data:text/html,<title>Fullscreen playback fixture</title><h1>Fullscreen playback fixture</h1>')
  window.on('focus', () => {
    if (window.isFullScreen()) writeFileSync(join(profile, 'active'), JSON.stringify({ fullscreen: true, focused: window.isFocused() }))
  })
  window.once('enter-full-screen', () => writeFileSync(join(profile, 'ready'), 'ready'))
  window.show()
  window.setFullScreen(true)
  // Reactivate this same fullscreen app after the parent tests internal focus.
  const commands = setInterval(() => {
    const stop = join(profile, 'stop')
    if (existsSync(stop)) {
      unlinkSync(stop)
      clearInterval(commands)
      if (!window.isFullScreen()) { app.quit(); return }
      // AppKit can ignore the next window's fullscreen request while this
      // Space is being removed. Finish leaving before destroying the fixture.
      // https://github.com/electron/electron/pull/53502
      const timeout = setTimeout(() => app.exit(1), 5000)
      window.once('leave-full-screen', () => {
        clearTimeout(timeout)
        // Electron's native delegate still uses the window after this event.
        // Defer closing it until the callback has returned to avoid reentrancy.
        setImmediate(() => app.quit())
      })
      window.setFullScreen(false)
      return
    }
    const command = join(profile, 'activate')
    if (existsSync(command)) { unlinkSync(command); window.show() }
  }, 50)
  setTimeout(() => app.exit(1), 25000)
})
