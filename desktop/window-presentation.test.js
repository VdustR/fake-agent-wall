import { describe, expect, it, vi } from 'vitest'
import { showWallWhenReady, wallWindowPresentation } from './window-presentation.js'

describe('wall presentation', () => {
  it('uses ordinary fullscreen on every platform', () => {
    for (const platform of ['darwin', 'win32', 'linux']) {
      expect(wallWindowPresentation({ platform, windowed: false })).toEqual({ fullscreen: true })
    }
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
