import { describe, expect, it } from 'vitest'
import { cloneTheme, defaultTheme } from './theme'

describe('bundled font defaults', () => {
  it('upgrades saved Monaspace defaults without changing the palette', () => {
    const saved = {
      ...defaultTheme,
      uiFont: "'Monaspace Xenon', 'SFMono-Regular', ui-monospace, monospace",
      codeFont: "'Monaspace Neon', 'SFMono-Regular', ui-monospace, monospace",
      colors: { ...defaultTheme.colors, background: '#123456' },
    }

    const restored = cloneTheme(saved)

    expect(restored.uiFont).toBe("'IBM Plex Sans', sans-serif")
    expect(restored.codeFont).toBe("'Commit Mono', ui-monospace, monospace")
    expect(restored.colors).toEqual(saved.colors)
    expect(saved.uiFont).toContain('Monaspace Xenon')
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
