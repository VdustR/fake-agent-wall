import { describe, expect, it } from 'vitest'
import { cloneTheme, defaultTheme } from './theme'

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
