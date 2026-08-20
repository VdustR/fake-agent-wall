import { describe, expect, it, vi } from 'vitest'
import { openTrayMenu, updateTrayMenu } from './tray-menu.js'

describe('tray menu', () => {
  it('keeps the macOS menu detached so a left click does not open it', () => {
    const tray = { setContextMenu: vi.fn() }
    const menu = {}

    expect(updateTrayMenu(tray, menu, true)).toBe(menu)
    expect(tray.setContextMenu).not.toHaveBeenCalled()
  })

  it('binds the menu on Windows and Linux', () => {
    const tray = { setContextMenu: vi.fn() }
    const menu = {}

    updateTrayMenu(tray, menu, false)

    expect(tray.setContextMenu).toHaveBeenCalledWith(menu)
  })

  it('opens the supplied menu explicitly', () => {
    const tray = { popUpContextMenu: vi.fn() }
    const menu = {}

    openTrayMenu(tray, menu)

    expect(tray.popUpContextMenu).toHaveBeenCalledWith(menu)
  })
})
