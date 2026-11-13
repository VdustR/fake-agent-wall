import { interpolate, wcagContrast } from 'culori/fn'
import { afterEach, expect, it, vi } from 'vitest'
import { ANSI_KEYS, applyTheme, defaultTheme, presets, settingsFromPreset, type ThemeSettings } from './theme'

afterEach(() => vi.unstubAllGlobals())

function applied(theme: ThemeSettings): Map<string, string> {
  const values = new Map<string, string>()
  vi.stubGlobal('document', { documentElement: { style: {
    colorScheme: '',
    setProperty: (name: string, value: string) => values.set(name, value),
  } } })
  applyTheme(theme)
  return values
}

it('keeps instrument text and history strokes readable across every bundled palette', () => {
  for (const preset of presets) {
    const theme = settingsFromPreset(preset)
    const values = applied(theme)
    const surface = interpolate([theme.colors.background, theme.colors.foreground], 'oklch')
    for (const [step, fraction] of [['050', .04], ['100', .07], ['150', .1]] as const) {
      const ink = values.get(`--readout-${step}`) ?? values.get('--amber') ?? ''
      expect(ink, `${preset.id} readout ${step}`).toMatch(/^#[\da-f]{6}$/i)
      expect(wcagContrast(ink, surface(fraction)), `${preset.id} readout ${step}`).toBeGreaterThanOrEqual(4.5)
    }
    for (const role of ['primary', 'secondary']) {
      const ink = values.get(`--plot-${role}`) ?? values.get(role === 'primary' ? '--cue' : '--amber') ?? ''
      expect(ink, `${preset.id} plot ${role}`).toMatch(/^#[\da-f]{6}$/i)
      expect(wcagContrast(ink, surface(.07)), `${preset.id} plot ${role}`).toBeGreaterThanOrEqual(3)
    }
  }
})

it('handles custom mid-gray surfaces instead of assuming a dark or light theme', () => {
  const theme = { ...defaultTheme, colors: { ...defaultTheme.colors, background: '#777777', foreground: '#aaaaaa', brightYellow: '#999999', green: '#888888' } }
  const values = applied(theme)
  const surface = interpolate([theme.colors.background, theme.colors.foreground], 'oklch')
  for (const [step, fraction] of [['050', .04], ['100', .07], ['150', .1]] as const) {
    expect(wcagContrast(values.get(`--readout-${step}`) ?? values.get('--amber') ?? '', surface(fraction))).toBeGreaterThanOrEqual(4.5)
  }
})

it('preserves all original terminal colors and lamp colors when deriving UI ink', () => {
  for (const preset of presets) {
    const theme = settingsFromPreset(preset)
    const original = structuredClone(theme)
    const values = applied(theme)
    for (const key of ANSI_KEYS) {
      const name = key.replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`)
      expect(values.get(`--ansi-${name}`)).toBe(theme.colors[key])
    }
    expect(values.get('--term-bg')).toBe(theme.colors.background)
    expect(values.get('--term-fg')).toBe(theme.colors.foreground)
    expect(values.get('--term-cursor')).toBe(theme.colors.cursor)
    expect(values.get('--term-selection')).toBe(theme.colors.selection)
    expect(values.get('--amber')).toBe(theme.colors.brightYellow)
    expect(values.get('--cue')).toBe(theme.colors.green)
    expect(theme).toEqual(original)
  }
})

it('retains Gruvbox signal hues when they already meet the reading targets', () => {
  const values = applied(defaultTheme)
  for (const step of ['050', '100', '150']) expect(values.get(`--readout-${step}`)).toBe(defaultTheme.colors.brightYellow)
  expect(values.get('--plot-primary')).toBe(defaultTheme.colors.green)
  expect(values.get('--plot-secondary')).toBe(defaultTheme.colors.brightYellow)
})
