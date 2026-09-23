import { describe, expect, it, vi } from 'vitest'
import {
  applyWallPresentation,
  releaseWallPresentation,
  showWallWhenReady,
  wallWindowPresentation,
} from './window-presentation.js'

describe('wall window presentation', () => {
  it('uses kiosk mode and hides the taskbar entry on Windows', () => {
    expect(wallWindowPresentation({ platform: 'win32', windowed: false })).toEqual({
      kiosk: true,
      skipTaskbar: true,
    })
  })

  it('avoids native fullscreen Spaces on macOS and uses fullscreen on Linux', () => {
    expect(wallWindowPresentation({ platform: 'darwin', windowed: false })).toEqual({})
    expect(wallWindowPresentation({ platform: 'linux', windowed: false })).toEqual({
      fullscreen: true,
    })
    expect(wallWindowPresentation({ platform: 'win32', windowed: true })).toEqual({})
  })

  it('enters and leaves macOS simple fullscreen for a production wall', () => {
    const wall = {
      isSimpleFullScreen: vi.fn(() => true),
      setSimpleFullScreen: vi.fn(),
    }

    applyWallPresentation(wall, { platform: 'darwin', windowed: false })
    releaseWallPresentation(wall, { platform: 'darwin', windowed: false })

    expect(wall.setSimpleFullScreen).toHaveBeenNthCalledWith(1, true)
    expect(wall.setSimpleFullScreen).toHaveBeenNthCalledWith(2, false)
  })

  it('does not change simple fullscreen for windowed or non-macOS walls', () => {
    const wall = {
      isSimpleFullScreen: vi.fn(() => true),
      setSimpleFullScreen: vi.fn(),
    }

    applyWallPresentation(wall, { platform: 'darwin', windowed: true })
    releaseWallPresentation(wall, { platform: 'darwin', windowed: true })
    applyWallPresentation(wall, { platform: 'win32', windowed: false })
    releaseWallPresentation(wall, { platform: 'win32', windowed: false })

    expect(wall.setSimpleFullScreen).not.toHaveBeenCalled()
  })

  it('shows and focuses the preferred wall after the renderer is ready', () => {
    const wall = { show: vi.fn(), focus: vi.fn(), showInactive: vi.fn() }

    showWallWhenReady(wall, true)

    expect(wall.show).toHaveBeenCalledOnce()
    expect(wall.focus).toHaveBeenCalledOnce()
    expect(wall.showInactive).not.toHaveBeenCalled()
  })

  it('shows secondary walls without taking focus', () => {
    const wall = { show: vi.fn(), focus: vi.fn(), showInactive: vi.fn() }

    showWallWhenReady(wall, false)

    expect(wall.showInactive).toHaveBeenCalledOnce()
    expect(wall.show).not.toHaveBeenCalled()
    expect(wall.focus).not.toHaveBeenCalled()
  })
})
