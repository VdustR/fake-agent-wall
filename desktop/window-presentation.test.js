import { describe, expect, it, vi } from 'vitest'
import { showWallWhenReady, wallWindowPresentation } from './window-presentation.js'

describe('wall presentation', () => {
  it('uses ordinary fullscreen on Windows/Linux, and display bounds on macOS', () => {
    for (const platform of ['win32', 'linux']) {
      expect(wallWindowPresentation({ platform, windowed: false })).toEqual({ fullscreen: true })
    }
    expect(wallWindowPresentation({ platform: 'darwin', windowed: false })).toEqual({})
    expect(wallWindowPresentation({ platform: 'win32', windowed: true })).toEqual({})
  })

  it('shows the preferred window normally and secondary walls without activation', () => {
    const wall = { show: vi.fn(), showInactive: vi.fn() }
    showWallWhenReady(wall, true)
    showWallWhenReady(wall, false)
    expect(wall.show).toHaveBeenCalledOnce()
    expect(wall.showInactive).toHaveBeenCalledOnce()
  })
})
