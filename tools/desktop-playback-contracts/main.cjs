const assert = require('node:assert/strict')
const { writeFileSync, mkdirSync } = require('node:fs')
const { spawn } = require('node:child_process')
const { once } = require('node:events')
const { join } = require('node:path')
const { pathToFileURL } = require('node:url')
const { app, BrowserWindow, Menu, powerMonitor } = require('electron')

const runDir = process.env.PLAYBACK_RUN_DIR
app.setPath('userData', runDir)
app.getLoginItemSettings = () => ({ wasOpenedAtLogin: true, openAtLogin: false })
writeFileSync(join(runDir, 'settings.json'), JSON.stringify({
  idleStart: false, idleMinutes: 1, keepAwake: 'never', launchAtLogin: false,
}))
let menu
const buildMenu = Menu.buildFromTemplate.bind(Menu)
Menu.buildFromTemplate = template => {
  const result = buildMenu(template)
  if (template.some(item => item.label === 'Quit Fake Agent Wall')) menu = result
  return result
}
const passed = []
let phase = 'initial'
for (const event of ['did-become-active', 'did-resign-active', 'browser-window-focus', 'browser-window-blur']) {
  app.on(event, () => console.log(JSON.stringify({ at: new Date().toISOString(), phase, event })))
}
let activator = null
let activatorExit = null
const pause = ms => new Promise(resolve => setTimeout(resolve, ms))
function until(predicate, description) {
  const deadline = Date.now() + 5000
  return new Promise((resolve, reject) => {
    const check = () => {
      if (predicate()) resolve()
      else if (Date.now() >= deadline) reject(new Error(description))
      else setTimeout(check, 25)
    }
    check()
  })
}
async function play() {
  menu.items.find(item => item.label === 'Play now').click()
  await until(() => BrowserWindow.getAllWindows().some(window => window.isFocused()), 'wall must acquire initial focus')
  return BrowserWindow.getFocusedWindow()
}

app.whenReady().then(async () => {
  try {
    await import(pathToFileURL(join(__dirname, '../../desktop/main.js')).href)
    await until(() => menu, 'tray must be initialized')
    const wall = await play()
    passed.push('initial-focus')
    phase = 'internal-window-transfer'

    // A second real window models transferring focus within this app. Theme
    // settings stay inside the original WebContents and need no activation.
    const auxiliary = new BrowserWindow({ show: false, width: 320, height: 240 })
    await auxiliary.loadURL('about:blank')
    auxiliary.show()
    await until(() => auxiliary.isFocused(), 'auxiliary window must acquire focus')
    await pause(100)
    assert.equal(wall.isDestroyed(), false)
    auxiliary.destroy()
    wall.focus()
    await until(() => wall.isFocused(), 'wall must remain usable after internal focus transfer')
    passed.push('internal-window-transfer')
    phase = 'external-app'

    // Activate a task-owned second process. This exercises real AppKit app
    // deactivation without touching another user's app or requesting permission.
    const profile = join(runDir, 'activator')
    mkdirSync(profile)
    activator = spawn(process.execPath, [join(__dirname, 'activate.cjs')], {
      env: { ...process.env, ACTIVATOR_PROFILE: profile }, stdio: ['ignore', 'pipe', 'pipe'],
    })
    activatorExit = once(activator, 'exit')
    activator.stderr.on('data', data => process.stderr.write(data))
    await until(() => wall.isDestroyed(), 'app deactivation must close the wall')
    assert.equal(BrowserWindow.getAllWindows().length, 0)
    await pause(100)
    assert.equal(BrowserWindow.getAllWindows().length, 0)
    passed.push('app-deactivation-exit')
    activator.kill('SIGTERM')
    await activatorExit
    activator = null

    phase = 'session-stop'
    const next = await play()
    powerMonitor.emit('suspend')
    assert.equal(next.isDestroyed(), true)
    powerMonitor.emit('unlock-screen')
    powerMonitor.emit('resume')
    await pause(100)
    assert.equal(BrowserWindow.getAllWindows().length, 0)
    passed.push('session-stop')
    writeFileSync(join(runDir, 'results.json'), JSON.stringify({ electron: process.versions.electron, passed }))
    console.log(JSON.stringify({ electron: process.versions.electron, passed }))
    app.quit()
  } catch (error) {
    console.error({ phase, passed, windows: BrowserWindow.getAllWindows().map(w => ({ focused: w.isFocused(), visible: w.isVisible() })) }); console.error(error)
    if (activator) { activator.kill('SIGTERM'); await activatorExit; activator = null }
    app.exit(1)
  } finally {
    if (activator) {
      activator.kill('SIGTERM')
      await activatorExit
    }
  }
})
