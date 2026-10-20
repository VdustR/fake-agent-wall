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
  setInterval(() => {
    const command = join(profile, 'activate')
    if (existsSync(command)) { unlinkSync(command); window.show() }
  }, 50)
  setTimeout(() => app.quit(), 25000)
})
