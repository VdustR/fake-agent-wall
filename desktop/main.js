import {
  app,
  BrowserWindow,
  Menu,
  ipcMain,
  nativeImage,
  powerMonitor,
  powerSaveBlocker,
  screen,
  Tray,
} from 'electron'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { getSettings, setSettings } from './settings.js'
import { getSystemActivity } from './activity-monitor.js'
import { shouldDeferIdleStart } from './activity-guards.js'

const HERE = dirname(fileURLToPath(import.meta.url))
const DEV_URL = process.env.AGENT_WALL_DEV_URL
/**
 * Opens the wall in an ordinary window instead of taking the screen. A kiosk
 * window that swallows every key is close to undebuggable, and nobody should
 * have to hand over their display to check a layout change.
 */
const WINDOWED = process.env.AGENT_WALL_WINDOWED === '1'
/** Long enough to be intentional, short enough to remain a usable escape hatch. */
const EXIT_HOLD_MS = 1200
/** Repeated typing is treated as a sign that the operator is looking for an exit. */
const HELP_KEY_COUNT = 4
const HELP_KEY_WINDOW_MS = 1800
const IDLE_POLL_MS = 2000
const IS_MAC = process.platform === 'darwin'

let wall = null
let tray = null
let blockerId = null
let escDown = false
let exitArmed = false
let exitTimer = null
let recentKeyTimes = []
let idleTimer = null
let idleCheckRunning = false
let themePanelOpen = false

/* ------------------------------------------------------------------- window */

function openWall() {
  if (wall) {
    wall.show()
    wall.focus()
    return
  }
  cancelExitHold(false)
  recentKeyTimes = []
  themePanelOpen = false

  const display = screen.getDisplayNearestPoint(screen.getCursorScreenPoint())

  wall = new BrowserWindow({
    ...(WINDOWED ? { width: 1280, height: 800, center: true } : display.bounds),
    show: false,
    frame: WINDOWED,
    resizable: false,
    movable: false,
    minimizable: false,
    maximizable: false,
    fullscreenable: true,
    backgroundColor: '#08090a',
    // The wall is the whole screen; there is nothing behind it to reveal.
    hasShadow: false,
    webPreferences: {
      preload: join(HERE, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      // The generated terminal fleet animates continuously; letting Chromium throttle the
      // page the moment it is occluded is exactly the freeze this prop must
      // never show.
      backgroundThrottling: false,
    },
  })

  if (!WINDOWED) {
    // On macOS, simple fullscreen rather than native: no Space transition, no
    // animation on show or hide, and no Esc-to-exit binding of its own to fight
    // with ours. Other platforms have no such distinction.
    if (IS_MAC) wall.setSimpleFullScreen(true)
    else wall.setFullScreen(true)
    wall.setAlwaysOnTop(true, 'screen-saver')
    wall.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true })
    swallowInput(wall.webContents)
  }

  wall.once('ready-to-show', () => {
    wall.show()
    wall.focus()
  })
  wall.on('closed', () => {
    wall = null
    applyPowerBlocker()
    refreshTray()
  })
  // A wedged renderer must not be able to trap the screen.
  wall.webContents.on('render-process-gone', () => closeWall())
  wall.webContents.on('unresponsive', () => closeWall())

  if (DEV_URL) wall.loadURL(DEV_URL)
  else wall.loadFile(join(HERE, '..', 'dist', 'index.html'))

  applyPowerBlocker()
  refreshTray()
}

function closeWall() {
  if (!wall) return
  cancelExitHold(false)
  const w = wall
  wall = null
  if (!WINDOWED && IS_MAC) w.setSimpleFullScreen(false)
  w.destroy()
  applyPowerBlocker()
  refreshTray()
}

/**
 * The wall accepts exactly one gesture: holding Escape. Everything else — keys,
 * accelerators, clicks — is consumed so nothing behind the wall can react.
 */
function swallowInput(wc) {
  wc.on('before-input-event', (event, input) => {
    if (input.type === 'keyUp') {
      if (!themePanelOpen) event.preventDefault()
      if (input.key === 'Escape' && !themePanelOpen) finishExitHold()
      return
    }
    if (input.type !== 'keyDown') {
      if (!themePanelOpen) event.preventDefault()
      return
    }

    const themeShortcut = (input.meta || input.control) && input.shift && input.code === 'Comma'
    if (themeShortcut) {
      recentKeyTimes = []
      wc.send('wall:theme-toggle')
      event.preventDefault()
      return
    }
    if (input.key === 'Escape') {
      if (themePanelOpen) wc.send('wall:theme-close')
      else startExitHold()
      event.preventDefault()
      return
    }
    if (themePanelOpen) return
    trackHelpKey(input)
    event.preventDefault()
  })
}

function startExitHold() {
  if (!wall) return
  if (themePanelOpen) {
    wall.webContents.send('wall:theme-close')
    return
  }
  if (escDown) return
  escDown = true
  clearTimeout(exitTimer)
  hint('holding')
  exitTimer = setTimeout(() => {
    exitTimer = null
    if (!escDown) return
    exitArmed = true
    hint('armed')
  }, EXIT_HOLD_MS)
}

function finishExitHold() {
  if (!escDown) return
  if (exitArmed) {
    // Close only after Electron has received and consumed this physical keyup.
    // The application revealed behind the wall never becomes the key target
    // while Escape is still down.
    closeWall()
    return
  }
  cancelExitHold()
}

function cancelExitHold(showHint = true) {
  clearTimeout(exitTimer)
  exitTimer = null
  const wasHolding = escDown
  escDown = false
  exitArmed = false
  if (wasHolding && showHint) hint('ready')
}

function trackHelpKey(input) {
  // A deliberate shortcut is navigation, not evidence that the operator is
  // searching for an exit. Exclude the entire chord, including its lead-in.
  if (input.isAutoRepeat || input.meta || input.control || input.alt || input.shift) return
  if (input.code === 'MetaLeft' || input.code === 'MetaRight' || input.code === 'ControlLeft' || input.code === 'ControlRight' || input.code === 'AltLeft' || input.code === 'AltRight' || input.code === 'ShiftLeft' || input.code === 'ShiftRight') return
  const now = Date.now()
  recentKeyTimes = recentKeyTimes.filter(time => now - time <= HELP_KEY_WINDOW_MS)
  recentKeyTimes.push(now)
  if (recentKeyTimes.length < HELP_KEY_COUNT) return
  recentKeyTimes = []
  hint('ready')
}

ipcMain.on('wall:theme-panel', (event, open) => {
  if (!wall || event.sender !== wall.webContents) return
  themePanelOpen = open === true
  if (themePanelOpen) {
    cancelExitHold(false)
    recentKeyTimes = []
  }
})

/** Ask the page to surface the exit hint. Purely cosmetic; exiting never depends on it. */
function hint(state) {
  if (wall && !wall.webContents.isDestroyed()) {
    wall.webContents.send('wall:hint', { state, holdMs: EXIT_HOLD_MS })
  }
}

/* -------------------------------------------------------------------- power */

function applyPowerBlocker() {
  const { keepAwake } = getSettings()
  const want = keepAwake === 'always' || (keepAwake === 'playing' && wall !== null)

  if (want && blockerId === null) {
    // Also prevents system sleep, which is what "caffeine" means here.
    blockerId = powerSaveBlocker.start('prevent-display-sleep')
  } else if (!want && blockerId !== null) {
    powerSaveBlocker.stop(blockerId)
    blockerId = null
  }
}

/* --------------------------------------------------------------------- idle */

function startIdleWatch() {
  clearInterval(idleTimer)
  idleTimer = setInterval(async () => {
    if (idleCheckRunning) return
    const s = getSettings()
    if (!s.idleStart || wall) return
    if (powerMonitor.getSystemIdleTime() < s.idleMinutes * 60) return

    idleCheckRunning = true
    try {
      const activity = await getSystemActivity()
      if (!wall && !shouldDeferIdleStart(s, activity)) openWall()
    } finally {
      idleCheckRunning = false
    }
  }, IDLE_POLL_MS)
}

/* --------------------------------------------------------------------- tray */

function trayIcon() {
  // A template image adopts the macOS menu bar's own colour in light and dark.
  // Elsewhere a template renders as a black-on-black smudge, so those platforms
  // get the coloured icon instead.
  if (!IS_MAC) return nativeImage.createFromPath(join(HERE, 'assets', 'tray.png'))
  const filename = wall ? 'trayPlayingTemplate.png' : 'trayTemplate.png'
  const img = nativeImage.createFromPath(join(HERE, 'assets', filename))
  img.setTemplateImage(true)
  return img
}

function refreshTray() {
  if (!tray) return
  const s = getSettings()
  if (IS_MAC) tray.setImage(trayIcon())
  tray.setToolTip(wall ? 'Fake Agent Wall — playing (hold esc to stop)' : 'Fake Agent Wall — click to play')

  const minuteChoice = (m) => ({
    label: `${m} min`,
    type: 'radio',
    checked: s.idleMinutes === m,
    click: () => update({ idleMinutes: m }),
  })
  const awakeChoice = (value, label) => ({
    label,
    type: 'radio',
    checked: s.keepAwake === value,
    click: () => update({ keepAwake: value }),
  })

  tray.setContextMenu(
    Menu.buildFromTemplate([
      wall
        ? { label: 'Stop', click: () => closeWall() }
        : { label: 'Play now', click: () => openWall() },
      { type: 'separator' },
      {
        label: 'Start when idle',
        type: 'checkbox',
        checked: s.idleStart,
        click: () => update({ idleStart: !s.idleStart }),
      },
      {
        label: 'Idle after',
        submenu: [1, 2, 3, 5, 10, 15, 30, 60].map(minuteChoice),
      },
      {
        label: 'Delay automatic start while',
        visible: IS_MAC,
        submenu: [
          {
            label: 'Audio is playing',
            type: 'checkbox',
            checked: s.deferWhileAudioPlaying,
            click: () => update({ deferWhileAudioPlaying: !s.deferWhileAudioPlaying }),
          },
          {
            label: 'Camera is in use',
            type: 'checkbox',
            checked: s.deferWhileCameraInUse,
            click: () => update({ deferWhileCameraInUse: !s.deferWhileCameraInUse }),
          },
          {
            label: 'Another app is full screen',
            type: 'checkbox',
            checked: s.deferWhileFullScreen,
            click: () => update({ deferWhileFullScreen: !s.deferWhileFullScreen }),
          },
        ],
      },
      {
        label: 'Keep display awake',
        submenu: [
          awakeChoice('playing', 'While playing'),
          awakeChoice('always', 'Always'),
          awakeChoice('never', 'Never'),
        ],
      },
      { type: 'separator' },
      {
        label: 'Open at login',
        type: 'checkbox',
        checked: s.launchAtLogin,
        visible: process.platform !== 'linux',
        click: () => update({ launchAtLogin: !s.launchAtLogin }),
      },
      { type: 'separator' },
      { label: `Version ${app.getVersion()}`, enabled: false },
      {
        label: 'Quit Fake Agent Wall',
        accelerator: IS_MAC ? 'Command+Q' : 'Ctrl+Q',
        click: () => app.quit(),
      },
    ]),
  )
}

function update(patch) {
  const s = setSettings(patch)
  syncLoginItem(s.launchAtLogin)
  applyPowerBlocker()
  refreshTray()
}

/**
 * An unsigned or unpackaged build cannot register a login item, and macOS
 * reports that as a hard error. The setting is a convenience, so a refusal is
 * logged and shrugged off rather than allowed to break startup.
 */
function syncLoginItem(openAtLogin) {
  // Electron does not implement login items on Linux.
  if (process.platform === 'linux') return
  try {
    if (app.getLoginItemSettings().openAtLogin === openAtLogin) return
    app.setLoginItemSettings({ openAtLogin })
  } catch (err) {
    console.error('[fake-agent-wall] could not change the login item:', err)
  }
}

/* ---------------------------------------------------------------- lifecycle */

// One instance only: a second launch plays on the existing one instead of
// stacking a second wall on the same screen.
if (!app.requestSingleInstanceLock()) {
  app.quit()
} else {
  app.on('second-instance', () => openWall())

  app.whenReady().then(() => {
    tray = new Tray(trayIcon())
    // Left click plays immediately; the menu is on right click. This is the
    // "one click" path, and it is why no context menu is bound to plain click.
    if (IS_MAC) {
      tray.on('click', () => (wall ? closeWall() : openWall()))
      tray.on('right-click', () => tray.popUpContextMenu())
    } else {
      // Windows and Linux expect a left click to open the menu, so the one-click
      // path there is launching the app itself.
      tray.on('click', () => tray.popUpContextMenu())
    }
    refreshTray()

    const s = getSettings()
    syncLoginItem(s.launchAtLogin)
    applyPowerBlocker()
    startIdleWatch()

    // Launching the app is itself the one click: it plays straight away, unless
    // macOS started it at login, where playing over the user's desktop would be
    // an ambush.
    if (!app.getLoginItemSettings().wasOpenedAtLogin) openWall()
  })

  // Reopening from the Dock plays again rather than resurrecting a blank window.
  app.on('activate', () => openWall())

  // The tray is the app. Closing the wall must not quit.
  app.on('window-all-closed', (e) => e?.preventDefault?.())

  app.on('will-quit', () => {
    clearInterval(idleTimer)
    if (blockerId !== null) powerSaveBlocker.stop(blockerId)
  })
}
