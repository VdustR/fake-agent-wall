import { EventEmitter } from 'node:events'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const originalPlatform = process.platform
let harness

beforeEach(() => {
  vi.resetModules()
  vi.useFakeTimers()
  Object.defineProperty(process, 'platform', { value: 'darwin' })
  const app = new EventEmitter()
  Object.assign(app, {
    requestSingleInstanceLock: () => true,
    whenReady: () => Promise.resolve(),
    getLoginItemSettings: () => ({ wasOpenedAtLogin: harness.idle, openAtLogin: false }),
    getVersion: () => 'test',
    focus: vi.fn(),
    quit: vi.fn(),
  })
  const powerMonitor = new EventEmitter()
  powerMonitor.getSystemIdleTime = () => 600
  const screen = new EventEmitter()
  Object.assign(screen, {
    getAllDisplays: () => [{ id: 1, bounds: { x: 0, y: 0, width: 1280, height: 800 } }],
    getDisplayNearestPoint: () => ({ id: 1 }),
    getCursorScreenPoint: () => ({ x: 0, y: 0 }),
  })
  class BrowserWindow extends EventEmitter {
    constructor() {
      super()
      this.webContents = new EventEmitter()
      Object.assign(this.webContents, { id: harness.windows.length + 1, send: vi.fn(), isDestroyed: () => false })
      harness.windows.push(this)
    }
    setAlwaysOnTop() {}
    setVisibleOnAllWorkspaces() {}
    setSimpleFullScreen() {}
    isSimpleFullScreen() { return true }
    isDestroyed() { return this.destroyed === true }
    show() { this.emit('focus') }
    showInactive() {}
    moveTop() {}
    focus() { this.emit('focus') }
    destroy() { this.destroyed = true; this.emit('closed') }
    loadFile() { queueMicrotask(() => this.emit('ready-to-show')) }
  }
  class Tray {
    on() {}
    setImage() {}
    setToolTip() {}
  }
  harness = {
    app, powerMonitor, windows: [], idle: false,
    state: { foreground: true, visible: true, focused: true },
    settings: { idleStart: true, idleMinutes: 1, keepAwake: 'never', launchAtLogin: false },
    activity: { cameraInUse: false },
    presentation: vi.fn(),
  }
  vi.doMock('electron', () => ({
    app, powerMonitor, screen, BrowserWindow, Tray, ipcMain: new EventEmitter(),
    Menu: { buildFromTemplate: value => value },
    nativeImage: { createFromPath: () => ({ setTemplateImage() {} }) },
    powerSaveBlocker: { start: vi.fn(), stop: vi.fn() },
  }))
  vi.doMock('./settings.js', () => ({ getSettings: () => harness.settings, setSettings: vi.fn() }))
  vi.doMock('./presentation-guard.js', () => ({
    getWallForegroundState: () => harness.state,
    setPresentationGuard: harness.presentation,
  }))
  vi.doMock('./activity-monitor.js', () => ({ getSystemActivity: async () => harness.activity }))
})

afterEach(() => {
  harness.app.emit('will-quit')
  vi.useRealTimers()
  Object.defineProperty(process, 'platform', { value: originalPlatform })
  vi.doUnmock('electron')
  vi.doUnmock('./settings.js')
  vi.doUnmock('./presentation-guard.js')
  vi.doUnmock('./activity-monitor.js')
})

async function launch(idle = false) {
  harness.idle = idle
  await import('./main.js')
  await vi.advanceTimersByTimeAsync(idle ? 2500 : 1500)
  expect(harness.windows).toHaveLength(1)
  return harness.windows[0]
}

function key(window, type) {
  const event = { preventDefault: vi.fn() }
  window.webContents.emit('before-input-event', event, { type, key: 'Escape', code: 'Escape' })
  return event
}

describe('desktop main foreground integration', () => {
  it('starts automatically despite enabled obsolete audio/fullscreen settings', async () => {
    Object.assign(harness.settings, { deferWhileAudioPlaying: true, deferWhileFullScreen: true })
    harness.activity = { cameraInUse: false, audioPlaying: true, fullScreen: true }
    await launch(true)
    expect(harness.presentation).toHaveBeenLastCalledWith(true)
  })

  it('retains camera deferral and its opt-out', async () => {
    harness.idle = true
    harness.settings.deferWhileCameraInUse = true
    harness.activity = { cameraInUse: true }
    await import('./main.js')
    await vi.advanceTimersByTimeAsync(2500)
    expect(harness.windows).toHaveLength(0)
    harness.settings.deferWhileCameraInUse = false
    await vi.advanceTimersByTimeAsync(2000)
    expect(harness.windows).toHaveLength(1)
  })
  it('rechecks the foreground when a previously scheduled blur recovery fires', async () => {
    const wall = await launch()
    harness.app.focus.mockClear()
    wall.emit('blur')
    harness.state = { foreground: false, visible: true, focused: false }
    await vi.advanceTimersByTimeAsync(75)
    expect(harness.app.focus).not.toHaveBeenCalled()
    expect(harness.presentation).toHaveBeenLastCalledWith(false)
  })

  it('allows an explicit Dock activation to restore an occluded manual wall', async () => {
    await launch()
    harness.state = { foreground: true, visible: false, focused: false }
    await vi.advanceTimersByTimeAsync(1500)
    harness.app.focus.mockClear()
    harness.app.emit('activate')
    expect(harness.app.focus).toHaveBeenCalledOnce()
  })
  it.each([false, true])('keeps a full Escape hold usable across foreground samples (idle=%s)', async idle => {
    const wall = await launch(idle)
    expect(harness.presentation).toHaveBeenLastCalledWith(true)
    expect(key(wall, 'keyDown').preventDefault).toHaveBeenCalledOnce()
    await vi.advanceTimersByTimeAsync(1250)
    expect(wall.destroyed).not.toBe(true)
    expect(key(wall, 'keyUp').preventDefault).toHaveBeenCalledOnce()
    expect(wall.destroyed).toBe(true)
    expect(harness.presentation).toHaveBeenLastCalledWith(false)
  })

  it('releases manual restrictions and stale Escape when occluded, without stealing focus', async () => {
    const wall = await launch()
    expect(harness.presentation).toHaveBeenLastCalledWith(true)
    key(wall, 'keyDown')
    harness.app.focus.mockClear()
    harness.state = { foreground: true, visible: false, focused: true }
    await vi.advanceTimersByTimeAsync(1500)
    expect(harness.presentation).toHaveBeenLastCalledWith(false)
    expect(key(wall, 'keyUp').preventDefault).not.toHaveBeenCalled()
    expect(wall.destroyed).not.toBe(true)
    wall.emit('blur')
    await vi.advanceTimersByTimeAsync(1000)
    expect(harness.app.focus).not.toHaveBeenCalled()
    harness.state = { foreground: true, visible: true, focused: true }
    wall.emit('focus')
    expect(harness.presentation).toHaveBeenLastCalledWith(true)
  })

  it('closes idle playback after foreground takeover and waits a fresh idle interval', async () => {
    const wall = await launch(true)
    expect(harness.presentation).toHaveBeenLastCalledWith(true)
    harness.app.focus.mockClear()
    harness.state = { foreground: false, visible: true, focused: false }
    wall.emit('blur')
    await vi.advanceTimersByTimeAsync(500)
    expect(wall.destroyed).toBe(true)
    expect(harness.app.focus).not.toHaveBeenCalled()
    await vi.advanceTimersByTimeAsync(50000)
    expect(harness.windows).toHaveLength(1)
    harness.state = { foreground: true, visible: true, focused: true }
    await vi.advanceTimersByTimeAsync(12000)
    expect(harness.windows).toHaveLength(2)
  })

  it.each([false, true])('restores focus after unlock before delayed resume (idle=%s)', async idle => {
    const wall = await launch(idle)
    harness.powerMonitor.emit('suspend')
    harness.powerMonitor.emit('lock-screen')
    harness.state = { foreground: false, visible: false, focused: false }
    wall.emit('blur')
    harness.app.focus.mockClear()
    await vi.advanceTimersByTimeAsync(10000)
    expect(harness.app.focus).not.toHaveBeenCalled()
    harness.powerMonitor.emit('unlock-screen')
    await vi.advanceTimersByTimeAsync(75)
    expect(harness.app.focus).toHaveBeenCalledOnce()
    harness.state = { foreground: true, visible: true, focused: true }
    wall.emit('focus')
    expect(harness.presentation).toHaveBeenLastCalledWith(true)
    await vi.advanceTimersByTimeAsync(27000)
    harness.powerMonitor.emit('resume')
    expect(wall.destroyed).not.toBe(true)
  })
})
