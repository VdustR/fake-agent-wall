import { describe, expect, it, vi } from 'vitest'
import { showWallWhenReady, wallWindowPresentation } from './window-presentation.js'

describe('wall window presentation', () => {
  it('uses kiosk mode and hides the taskbar entry on Windows', () => {
    expect(wallWindowPresentation({ platform: 'win32', windowed: false })).toEqual({
      kiosk: true,
      skipTaskbar: true,
    })
  })

  it('keeps the existing platform-specific fullscreen modes', () => {
    expect(wallWindowPresentation({ platform: 'darwin', windowed: false })).toEqual({
      simpleFullscreen: true,
    })
    expect(wallWindowPresentation({ platform: 'linux', windowed: false })).toEqual({
      fullscreen: true,
    })
    expect(wallWindowPresentation({ platform: 'win32', windowed: true })).toEqual({})
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
