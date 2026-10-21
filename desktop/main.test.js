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
    getVersion: () => 'test', focus: vi.fn(), quit: vi.fn(),
  })
  const powerMonitor = new EventEmitter()
  powerMonitor.getSystemIdleTime = () => 600
  const screen = new EventEmitter()
  Object.assign(screen, {
    getAllDisplays: () => harness.displays,
    getDisplayNearestPoint: () => ({ id: 1 }),
    getCursorScreenPoint: () => ({ x: 0, y: 0 }),
  })
  class BrowserWindow extends EventEmitter {
    static getFocusedWindow() { return harness.focused }
    constructor(options) {
      super()
      this.options = options
      this.webContents = new EventEmitter()
      Object.assign(this.webContents, { id: harness.windows.length + 1, send: vi.fn(), isDestroyed: () => false })
      harness.windows.push(this)
    }
    isDestroyed() { return this.destroyed === true }
    isFullScreen() { return harness.nativeFullscreen === true }
    setOpacity = vi.fn()
    setFullScreen = vi.fn(() => { if (!harness.nativeFullscreen) this.emit('leave-full-screen') })
    show = vi.fn(() => { if (!harness.denyFocus) this.focus() })
    showInactive = vi.fn()
    focus = vi.fn(() => {
      if (harness.focused && harness.focused !== this) harness.focused.emit('blur')
      harness.focused = this
      this.emit('focus')
    })
    destroy() {
      this.destroyed = true
      if (harness.focused === this) harness.focused = null
      this.emit('closed')
    }
    loadFile() { queueMicrotask(() => this.emit('ready-to-show')) }
  }
  class Tray {
    on() {}
    setContextMenu() {}
    setImage() {}
    setToolTip() {}
  }
  const ipcMain = new EventEmitter()
  harness = {
    app, powerMonitor, screen, ipcMain, BrowserWindow, windows: [], focused: null, idle: false, denyFocus: false,
    displays: [{ id: 1, bounds: { x: 0, y: 0, width: 1280, height: 800 } }],
    settings: { idleStart: true, idleMinutes: 1, keepAwake: 'never', launchAtLogin: false },
    activity: { cameraInUse: false },
  }
  vi.doMock('electron', () => ({
    app, powerMonitor, screen, BrowserWindow, Tray, ipcMain,
    Menu: { buildFromTemplate: items => { const menu = Object.assign(new EventEmitter(), { items }); harness.menu = menu; return menu } },
    nativeImage: { createFromPath: () => ({ setTemplateImage() {} }) },
    powerSaveBlocker: { start: vi.fn(), stop: vi.fn() },
  }))
  vi.doMock('./settings.js', () => ({ getSettings: () => harness.settings, setSettings: vi.fn() }))
  vi.doMock('./activity-monitor.js', () => ({ getSystemActivity: async () => harness.activity }))
})

afterEach(() => {
  harness.app.emit('will-quit')
  vi.useRealTimers()
  Object.defineProperty(process, 'platform', { value: originalPlatform })
  vi.doUnmock('electron')
  vi.doUnmock('./settings.js')
  vi.doUnmock('./activity-monitor.js')
})

async function launch(idle = false) {
  harness.idle = idle
  await import('./main.js')
  await vi.advanceTimersByTimeAsync(idle ? 2500 : 1500)
  expect(harness.windows.length).toBe(harness.displays.length)
  return harness.windows[0]
}

function key(window, type, extra = {}) {
  const event = { preventDefault: vi.fn() }
  window.webContents.emit('before-input-event', event, { type, key: 'Escape', code: 'Escape', ...extra })
  return event
}

async function leaveApp(wall) {
  harness.focused = null
  wall.emit('blur')
  if (process.platform === 'darwin') harness.app.emit('did-resign-active')
  await vi.advanceTimersByTimeAsync(1)
}

describe('desktop playback lifecycle', () => {

  it('coalesces explicit playback requests until native retirement completes', async () => {
    harness.nativeFullscreen = true
    const wall = await launch()
    await leaveApp(wall)
    expect(wall.setOpacity).toHaveBeenCalledWith(0)
    expect(wall.isDestroyed()).toBe(false)
    harness.menu.items.find(item => item.label === 'Play now').click()
    harness.menu.items.find(item => item.label === 'Play now').click()
    expect(harness.windows).toHaveLength(1)
    wall.emit('leave-full-screen')
    await vi.advanceTimersByTimeAsync(0)
    expect(wall.isDestroyed()).toBe(true)
    expect(harness.windows).toHaveLength(2)
  })

  it('cancels queued playback when the user leaves the app again', async () => {
    harness.nativeFullscreen = true
    const wall = await launch()
    await leaveApp(wall)
    harness.menu.items.find(item => item.label === 'Play now').click()
    harness.app.emit('did-resign-active')
    wall.emit('leave-full-screen')
    await vi.advanceTimersByTimeAsync(0)
    expect(harness.windows).toHaveLength(1)
    expect(wall.isDestroyed()).toBe(true)
  })

  it('does not restart automatically when native retirement finishes', async () => {
    harness.nativeFullscreen = true
    const wall = await launch()
    await leaveApp(wall)
    wall.emit('leave-full-screen')
    await vi.advanceTimersByTimeAsync(2000)
    expect(harness.windows).toHaveLength(1)
    expect(wall.isDestroyed()).toBe(true)
  })

  it('cancels queued playback on suspend and does not reopen on wake', async () => {
    harness.nativeFullscreen = true
    const wall = await launch()
    await leaveApp(wall)
    harness.menu.items.find(item => item.label === 'Play now').click()
    harness.powerMonitor.emit('suspend')
    wall.emit('leave-full-screen')
    await vi.advanceTimersByTimeAsync(0)
    harness.powerMonitor.emit('unlock-screen')
    harness.powerMonitor.emit('resume')
    await vi.advanceTimersByTimeAsync(100)
    expect(harness.windows).toHaveLength(1)
    expect(wall.isDestroyed()).toBe(true)
  })

  it('does not queue blocked-session requests for a later wake', async () => {
    harness.nativeFullscreen = true
    const wall = await launch()
    harness.powerMonitor.emit('suspend')
    harness.app.emit('activate')
    harness.app.emit('second-instance')
    harness.menu.items.find(item => item.label === 'Play now').click()
    harness.powerMonitor.emit('unlock-screen')
    harness.powerMonitor.emit('resume')
    wall.emit('leave-full-screen')
    await vi.advanceTimersByTimeAsync(100)
    expect(harness.windows).toHaveLength(1)
    expect(wall.isDestroyed()).toBe(true)
  })

  it('does not revive playback after quit while native retirement is pending', async () => {
    harness.nativeFullscreen = true
    const wall = await launch()
    await leaveApp(wall)
    harness.menu.items.find(item => item.label === 'Play now').click()
    harness.app.emit('before-quit')
    wall.emit('leave-full-screen')
    await vi.advanceTimersByTimeAsync(0)
    expect(harness.windows).toHaveLength(1)
    expect(harness.app.quit).toHaveBeenCalledOnce()
  })


  it.each(['darwin', 'win32', 'linux'])('takes focus once and closes the whole app display on departure on %s', async platform => {
    Object.defineProperty(process, 'platform', { value: platform })
    harness.displays.push({ id: 2, bounds: { x: 1280, y: 0, width: 1280, height: 800 } })
    const wall = await launch()
    expect(wall.show).toHaveBeenCalledOnce()
    expect(harness.windows[1].showInactive).toHaveBeenCalledOnce()
    const focusCalls = harness.app.focus.mock.calls.length
    await leaveApp(wall)
    expect(harness.windows.every(w => w.destroyed)).toBe(true)
    await vi.advanceTimersByTimeAsync(1000)
    expect(harness.app.focus).toHaveBeenCalledTimes(focusCalls)
    expect(wall.show).toHaveBeenCalledOnce()
  })

  it.each(['darwin', 'win32', 'linux'])('does not close when focus moves between the app windows on %s', async platform => {
    Object.defineProperty(process, 'platform', { value: platform })
    harness.displays.push({ id: 2, bounds: { x: 1280, y: 0, width: 1280, height: 800 } })
    await launch()
    harness.windows[1].focus()
    await vi.advanceTimersByTimeAsync(100)
    expect(harness.windows.every(w => !w.destroyed)).toBe(true)
  })

  it.each(['win32', 'linux'])('waits for a native menu to close before evaluating focus on %s', async platform => {
    Object.defineProperty(process, 'platform', { value: platform })
    const wall = await launch()
    harness.menu.emit('menu-will-show')
    harness.focused = null
    wall.emit('blur')
    await vi.advanceTimersByTimeAsync(100)
    expect(wall.destroyed).not.toBe(true)
    wall.focus()
    harness.menu.emit('menu-will-close')
    await vi.advanceTimersByTimeAsync(1)
    expect(wall.destroyed).not.toBe(true)
    harness.menu.emit('menu-will-show')
    harness.focused = null
    wall.emit('blur')
    harness.menu.emit('menu-will-close')
    await vi.advanceTimersByTimeAsync(1)
    expect(wall.destroyed).toBe(true)
  })

  it('does not treat macOS window blur or a theme panel as app departure', async () => {
    const wall = await launch()
    wall.emit('blur')
    harness.ipcMain.emit('wall:theme-panel', { sender: wall.webContents }, true)
    await vi.advanceTimersByTimeAsync(1500)
    expect(wall.destroyed).not.toBe(true)
    expect(key(wall, 'keyDown', { key: 'a', code: 'KeyA' }).preventDefault).not.toHaveBeenCalled()
    harness.ipcMain.emit('wall:theme-panel', { sender: wall.webContents }, false)
    expect(key(wall, 'keyDown', { key: 'a', code: 'KeyA' }).preventDefault).toHaveBeenCalledOnce()
  })

  it('ends a failed initial focus attempt instead of keeping an inert overlay', async () => {
    harness.denyFocus = true
    const wall = await launch()
    expect(wall.destroyed).toBe(true)
    expect(wall.show).toHaveBeenCalledOnce()
    expect(harness.app.focus).not.toHaveBeenCalled()
  })

  it.each([false, true])('closes on app departure and waits a complete idle interval (idle=%s)', async idle => {
    const wall = await launch(idle)
    await leaveApp(wall)
    expect(wall.destroyed).toBe(true)
    await vi.advanceTimersByTimeAsync(50000)
    expect(harness.windows).toHaveLength(1)
    await vi.advanceTimersByTimeAsync(12000)
    expect(harness.windows).toHaveLength(2)
  })

  it.each(['darwin', 'win32', 'linux'])('keeps held Escape on release and system shortcuts usable on %s', async platform => {
    Object.defineProperty(process, 'platform', { value: platform })
    const wall = await launch()
    for (const extra of [
      { key: 'Tab', code: 'Tab', meta: true },
      { key: 'Tab', code: 'Tab', alt: true },
      { key: 'q', code: 'KeyQ', control: true },
      { key: 'AudioVolumeUp', code: 'AudioVolumeUp' },
    ]) expect(key(wall, 'keyDown', extra).preventDefault).not.toHaveBeenCalled()
    expect(key(wall, 'keyDown').preventDefault).toHaveBeenCalledOnce()
    await vi.advanceTimersByTimeAsync(1250)
    expect(wall.destroyed).not.toBe(true)
    expect(key(wall, 'keyUp').preventDefault).toHaveBeenCalledOnce()
    if (platform === 'darwin') expect(wall.setOpacity).toHaveBeenCalledWith(0)
    await vi.advanceTimersByTimeAsync(0)
    expect(wall.destroyed).toBe(true)
  })

  it('cancels a held Escape on window blur', async () => {
    const wall = await launch()
    key(wall, 'keyDown')
    wall.emit('blur')
    await vi.advanceTimersByTimeAsync(1500)
    wall.focus()
    key(wall, 'keyUp')
    expect(wall.destroyed).not.toBe(true)
  })

  it('starts despite obsolete audio/fullscreen settings and keeps camera protection', async () => {
    Object.assign(harness.settings, { deferWhileAudioPlaying: true, deferWhileFullScreen: true })
    harness.activity = { cameraInUse: false, audioPlaying: true, fullScreen: true }
    await launch(true)
    expect(harness.windows[0].destroyed).not.toBe(true)
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

  it.each(['lock-screen', 'suspend', 'user-did-resign-active'])('closes on %s and never restores on wake', async event => {
    const wall = await launch()
    harness.powerMonitor.emit(event)
    expect(wall.setOpacity).toHaveBeenCalledWith(0)
    await vi.advanceTimersByTimeAsync(0)
    expect(wall.destroyed).toBe(true)
    const focusCalls = harness.app.focus.mock.calls.length
    await vi.advanceTimersByTimeAsync(30000)
    harness.powerMonitor.emit('unlock-screen')
    harness.powerMonitor.emit('resume')
    harness.powerMonitor.emit('user-did-become-active')
    await vi.advanceTimersByTimeAsync(50000)
    expect(harness.windows).toHaveLength(1)
    expect(harness.app.focus).toHaveBeenCalledTimes(focusCalls)
    await vi.advanceTimersByTimeAsync(12000)
    expect(harness.windows).toHaveLength(2)
  })

  it('replaces the last display window without ending playback', async () => {
    const wall = await launch()
    harness.displays[0].bounds.width = 1440
    harness.screen.emit('display-metrics-changed')
    await vi.advanceTimersByTimeAsync(1500)
    expect(wall.destroyed).toBe(true)
    expect(harness.windows).toHaveLength(2)
    expect(harness.windows[1].destroyed).not.toBe(true)
    expect(harness.windows[1].show).toHaveBeenCalledOnce()
    expect(harness.menu.items[0].label).toBe('Stop')
  })

  it.each(['win32', 'linux'])('ends playback when hiding leaves no app window focused on %s', async platform => {
    Object.defineProperty(process, 'platform', { value: platform })
    const wall = await launch()
    harness.focused = null
    wall.emit('hide')
    await vi.advanceTimersByTimeAsync(1)
    expect(wall.destroyed).toBe(true)
  })

  it('keeps a macOS fullscreen wall when the OS hides it for another app window', async () => {
    const wall = await launch()
    const auxiliary = new harness.BrowserWindow({})
    auxiliary.show()
    wall.emit('hide')
    await vi.advanceTimersByTimeAsync(100)
    expect(wall.destroyed).not.toBe(true)
    auxiliary.destroy()
  })

  it('ends playback when the last window is closed normally', async () => {
    const wall = await launch()
    wall.destroy()
    expect(harness.menu.items[0].label).toBe('Play now')
  })

  it('removes observers and pending work on shutdown', async () => {
    await launch()
    harness.app.emit('will-quit')
    await vi.advanceTimersByTimeAsync(0)
    expect(harness.powerMonitor.eventNames()).toEqual([])
    expect(vi.getTimerCount()).toBe(0)
  })
})
