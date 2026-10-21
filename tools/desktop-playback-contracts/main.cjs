const assert = require('node:assert/strict')
const { writeFileSync, mkdirSync, existsSync, readFileSync, unlinkSync } = require('node:fs')
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
const enteredFullscreen = new WeakSet()
app.on('browser-window-created', (_, window) => window.once('enter-full-screen', () => enteredFullscreen.add(window)))
let phase = 'initial'
for (const event of ['did-become-active', 'did-resign-active', 'browser-window-focus', 'browser-window-blur']) {
  app.on(event, () => console.log(JSON.stringify({ at: new Date().toISOString(), phase, event })))
}
let activator = null
let activatorExit = null
const pause = ms => new Promise(resolve => setTimeout(resolve, ms))
function until(predicate, description, timeout = 5000) {
  const deadline = Date.now() + timeout
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
  // Native fullscreen transitions are asynchronous, including when macOS is
  // removing the previous app's Space. Keep focus and transition deadlines
  // separate so a slow animation is not reported as failed activation.
  await until(() => BrowserWindow.getAllWindows().some(window => window.isFocused() && enteredFullscreen.has(window)), 'focused wall must finish entering fullscreen', 10000)
  return BrowserWindow.getFocusedWindow()
}

app.whenReady().then(async () => {
  try {
    await import(pathToFileURL(join(__dirname, '../../desktop/main.js')).href)
    await until(() => menu, 'tray must be initialized')
    // Establish another app's real native fullscreen Space before playing.
    const profile = join(runDir, 'activator')
    mkdirSync(profile)
    activator = spawn(process.execPath, [join(__dirname, 'activate.cjs')], {
      env: { ...process.env, ACTIVATOR_PROFILE: profile }, stdio: ['ignore', 'pipe', 'pipe'],
    })
    activatorExit = once(activator, 'exit')
    activator.stderr.on('data', data => process.stderr.write(data))
    await until(() => existsSync(join(profile, 'ready')), 'fullscreen fixture must be ready')
    const wall = await play()
    passed.push('initial-focus')
    await pause(500)
    assert.equal(wall.isDestroyed(), false)
    assert.equal(wall.isFocused(), true)
    passed.push('fullscreen-app-startup')
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
    wall.show()
    await until(() => wall.isFocused(), 'wall must remain usable after internal focus transfer')
    passed.push('internal-window-transfer')
    phase = 'external-app'

    // Return to the existing fullscreen fixture, exercising real deactivation.
    if (existsSync(join(profile, 'active'))) unlinkSync(join(profile, 'active'))
    writeFileSync(join(profile, 'activate'), 'activate')
    await until(() => wall.isDestroyed(), 'app deactivation must close the wall')
    assert.equal(BrowserWindow.getAllWindows().length, 0)
    await pause(100)
    assert.equal(BrowserWindow.getAllWindows().length, 0)
    passed.push('app-deactivation-exit')
    await until(() => existsSync(join(profile, 'active')), 'fullscreen fixture must receive focus again')
    const returned = JSON.parse(readFileSync(join(profile, 'active'), 'utf8'))
    assert.equal(returned.fullscreen, true)
    assert.equal(returned.focused, true)
    passed.push('fullscreen-return')
    // A process exit alone does not finish macOS's fullscreen Space teardown.
    // Ask the fixture to leave fullscreen before starting another wall.
    writeFileSync(join(profile, 'stop'), 'stop')
    const [exitCode, exitSignal] = await activatorExit
    activator = null
    assert.equal(exitSignal, null, 'fullscreen fixture must exit normally')
    assert.equal(exitCode, 0, 'fullscreen fixture must finish its Space teardown')

    phase = 'session-stop'
    const next = await play()
    powerMonitor.emit('suspend')
    assert.equal(next.getOpacity(), 0, 'suspend must remove the wall visually immediately')
    await until(() => next.isDestroyed(), 'suspend must finish native wall teardown')
    powerMonitor.emit('unlock-screen')
    powerMonitor.emit('resume')
    await pause(100)
    assert.equal(BrowserWindow.getAllWindows().length, 0)
    passed.push('session-stop')
    writeFileSync(join(runDir, 'results.json'), JSON.stringify({ electron: process.versions.electron, passed }))
    console.log(JSON.stringify({ electron: process.versions.electron, passed }))
    app.quit()
  } catch (error) {
    console.error({ phase, passed, windows: BrowserWindow.getAllWindows().map(w => ({ focused: w.isFocused(), visible: w.isVisible(), fullscreen: w.isFullScreen(), enteredFullscreen: enteredFullscreen.has(w) })) }); console.error(error)
    if (activator) { activator.kill('SIGTERM'); await activatorExit; activator = null }
    app.exit(1)
  } finally {
    if (activator) {
      activator.kill('SIGTERM')
      await activatorExit
    }
  }
})
