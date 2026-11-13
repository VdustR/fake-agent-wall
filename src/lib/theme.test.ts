import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { clearThemeSettings, cloneTheme, defaultTheme, loadTheme, presets, settingsFromPreset, THEME_STORAGE_KEY } from './theme'

describe('bundled font defaults', () => {
  it.each([
    ["'Monaspace Xenon', 'SFMono-Regular', ui-monospace, monospace", "'Monaspace Neon', 'SFMono-Regular', ui-monospace, monospace"],
    ["'IBM Plex Sans', sans-serif", "'Commit Mono', ui-monospace, monospace"],
  ])('upgrades saved defaults (%s) without changing the palette', (uiFont, codeFont) => {
    const saved = {
      ...defaultTheme,
      uiFont,
      codeFont,
      editorialFont: "'Instrument Serif', Charter, Georgia, serif",
      colors: { ...defaultTheme.colors, background: '#123456' },
    }

    const restored = cloneTheme(saved)

    expect(restored.uiFont).toBe("'Barlow Condensed', sans-serif")
    expect(restored.codeFont).toBe("'Monaspace Xenon', ui-monospace, monospace")
    expect(restored.editorialFont).toBe("'Cormorant Garamond', Georgia, serif")
    expect(restored.colors).toEqual(saved.colors)
    expect(saved.uiFont).toBe(uiFont)
  })

  it('preserves custom font choices and editorial text', () => {
    const saved = {
      ...defaultTheme,
      uiFont: 'Custom UI, sans-serif',
      codeFont: 'Custom Code, monospace',
      editorialFont: 'Custom Serif, serif',
    }

    expect(cloneTheme(saved)).toEqual(saved)
  })
})

describe('default palette', () => {
  const storageValues = new Map<string, string>()

  beforeEach(() => {
    storageValues.clear()
    const storage: Pick<Storage, 'getItem' | 'removeItem'> = {
      getItem: (key) => storageValues.get(key) ?? null,
      removeItem: (key) => { storageValues.delete(key) },
    }
    vi.stubGlobal('localStorage', storage)
  })

  afterEach(() => vi.unstubAllGlobals())

  it('starts fresh with standard Gruvbox Dark', () => {
    const theme = loadTheme()

    expect(theme.presetId).toBe('gruvbox-dark')
    expect(theme.colors.background).toBe('#282828')
    expect(theme.colors.foreground).toBe('#ebdbb2')
  })

  it('preserves an existing palette and custom colour', () => {
    const mocha = presets.find((preset) => preset.id === 'catppuccin-mocha')
    if (!mocha) throw new Error('Missing Catppuccin fixture')
    const saved = settingsFromPreset(mocha)
    saved.colors.cursor = '#123456'
    storageValues.set(THEME_STORAGE_KEY, JSON.stringify(saved))

    expect(loadTheme()).toEqual(saved)
  })

  it('restores Gruvbox Dark after clearing saved settings', () => {
    storageValues.set(THEME_STORAGE_KEY, JSON.stringify({ ...defaultTheme, presetId: 'custom' }))

    expect(clearThemeSettings()).toBe(true)
    expect(loadTheme().presetId).toBe('gruvbox-dark')
  })
})
