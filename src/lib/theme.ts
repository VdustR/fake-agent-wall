import presetData from '../data/colors.json'

export const ANSI_KEYS = [
  'black',
  'red',
  'green',
  'yellow',
  'blue',
  'purple',
  'cyan',
  'white',
  'brightBlack',
  'brightRed',
  'brightGreen',
  'brightYellow',
  'brightBlue',
  'brightPurple',
  'brightCyan',
  'brightWhite',
] as const

export const META_KEYS = ['background', 'foreground', 'cursor', 'selection'] as const

export type AnsiKey = (typeof ANSI_KEYS)[number]
export type MetaKey = (typeof META_KEYS)[number]
export type ThemeColors = Record<AnsiKey | MetaKey, string>

export interface ThemePreset {
  id: string
  name: string
  source: string
  sourcePath: string
  license: string
  scheme: Record<AnsiKey, string>
  metadata: Record<MetaKey, string> & { isDark: boolean }
}

export interface ThemeSettings {
  presetId: string
  colors: ThemeColors
  editorialFont: string
  uiFont: string
  codeFont: string
  wallLabel: string
}

const STORAGE_KEY = 'fake-agent-wall.theme.v3'
const LEGACY_STORAGE_KEYS = ['fake-agent-wall.theme.v1', 'fake-agent-wall.theme.v2'] as const
const HEX = /^#[0-9a-f]{6}$/i

const LEGACY_EDITORIAL_FONT = "'Source Serif 4', Charter, Georgia, serif"
const LEGACY_UI_FONT = "'Martian Mono', 'SFMono-Regular', ui-monospace, monospace"
const LEGACY_CODE_FONT = "Iosevka, 'SFMono-Regular', ui-monospace, monospace"
export const DEFAULT_EDITORIAL_FONT = "'Instrument Serif', Charter, Georgia, serif"
export const DEFAULT_UI_FONT = "'Monaspace Xenon', 'SFMono-Regular', ui-monospace, monospace"
export const DEFAULT_CODE_FONT = "'Monaspace Neon', 'SFMono-Regular', ui-monospace, monospace"
export const DEFAULT_WALL_LABEL = 'fake-agent-wall'

export const presets = presetData.colors as ThemePreset[]

export const allPresets = presets

export function settingsFromPreset(preset: ThemePreset): ThemeSettings {
  return {
    presetId: preset.id,
    colors: { ...preset.scheme, ...pickMetadata(preset) },
    editorialFont: DEFAULT_EDITORIAL_FONT,
    uiFont: DEFAULT_UI_FONT,
    codeFont: DEFAULT_CODE_FONT,
    wallLabel: DEFAULT_WALL_LABEL,
  }
}

const defaultPreset = presets.find((preset) => preset.id === 'catppuccin-mocha')
if (!defaultPreset) throw new Error('Bundled default theme is missing')

export const defaultTheme = settingsFromPreset(defaultPreset)

export function cloneTheme(theme: ThemeSettings): ThemeSettings {
  return {
    ...theme,
    editorialFont: theme.editorialFont === LEGACY_EDITORIAL_FONT ? DEFAULT_EDITORIAL_FONT : theme.editorialFont,
    uiFont: theme.uiFont === LEGACY_UI_FONT ? DEFAULT_UI_FONT : theme.uiFont,
    codeFont: theme.codeFont === LEGACY_CODE_FONT ? DEFAULT_CODE_FONT : theme.codeFont,
    wallLabel: normalizeWallLabel(theme.wallLabel),
    colors: { ...theme.colors },
  }
}

export function loadTheme(): ThemeSettings {
  try {
    // v1 defaulted to the removed Swarmdeck palette. v2 stored the two original
    // font roles; migrate it below so color and font choices survive v3.
    localStorage.removeItem(LEGACY_STORAGE_KEYS[0])
    const stored: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null')
    if (isThemeSettings(stored)) return cloneTheme(stored)
    const previous: unknown = JSON.parse(localStorage.getItem(LEGACY_STORAGE_KEYS[1]) ?? 'null')
    if (isLegacyThemeSettings(previous)) {
      return cloneTheme({ ...previous, editorialFont: DEFAULT_EDITORIAL_FONT })
    }
  } catch {
    // Invalid or unavailable storage should never stop the wall from playing.
  }
  return cloneTheme(defaultTheme)
}

export function saveTheme(theme: ThemeSettings): boolean {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cloneTheme(theme)))
    return true
  } catch {
    return false
  }
}

export function clearThemeSettings(): boolean {
  try {
    localStorage.removeItem(STORAGE_KEY)
    for (const key of LEGACY_STORAGE_KEYS) localStorage.removeItem(key)
    return true
  } catch {
    return false
  }
}

export function applyTheme(theme: ThemeSettings): void {
  const { colors } = theme
  const root = document.documentElement
  root.style.colorScheme = relativeLuminance(colors.background) > 0.5 ? 'light' : 'dark'
  const vars: Record<string, string> = {
    '--ink-000': colors.background,
    '--ink-050': mix(colors.background, colors.foreground, 4),
    '--ink-100': mix(colors.background, colors.foreground, 7),
    '--ink-150': mix(colors.background, colors.foreground, 10),
    '--ink-200': mix(colors.background, colors.foreground, 14),
    '--line': mix(colors.background, colors.foreground, 12),
    '--line-hi': mix(colors.background, colors.foreground, 22),
    '--txt': colors.foreground,
    '--txt-dim': mix(colors.background, colors.foreground, 72),
    '--txt-fnt': mix(colors.background, colors.foreground, 56),
    '--umd': mix(colors.background, colors.foreground, 84),
    '--txt-hi': strongerInk(colors.background, colors.foreground, colors.brightWhite),
    '--on-live': readableInk(colors.red),
    '--on-cue': readableInk(colors.green),
    '--on-coral': readableInk(colors.cursor),
    '--led-off': mix(colors.background, colors.foreground, 24),
    '--led-hot': colors.brightRed,
    '--live': colors.red,
    '--cue': colors.green,
    '--hold': colors.yellow,
    '--done': colors.blue,
    '--amber': colors.brightYellow,
    '--coral': colors.cursor,
    '--add': colors.brightGreen,
    '--add-bg': alpha(colors.green, 0.15),
    '--del': colors.brightRed,
    '--del-bg': alpha(colors.red, 0.13),
    '--selection': colors.selection,
    '--f-editorial': normalizedFontStack(theme.editorialFont, DEFAULT_EDITORIAL_FONT),
    '--f-umd': normalizedFontStack(theme.uiFont, DEFAULT_UI_FONT),
    '--f-term': normalizedFontStack(theme.codeFont, DEFAULT_CODE_FONT),
  }
  for (const [name, value] of Object.entries(vars)) root.style.setProperty(name, value)
}

function pickMetadata(preset: ThemePreset): Record<MetaKey, string> {
  const { background, foreground, cursor, selection } = preset.metadata
  return { background, foreground, cursor, selection }
}

function mix(background: string, foreground: string, foregroundPercent: number): string {
  return `color-mix(in oklch, ${background}, ${foreground} ${foregroundPercent}%)`
}

function alpha(color: string, amount: number): string {
  return `color-mix(in oklch, ${color} ${amount * 100}%, transparent)`
}

function readableInk(fill: string): string {
  return contrast(fill, '#08090a') >= contrast(fill, '#ffffff') ? '#08090a' : '#ffffff'
}

function strongerInk(background: string, first: string, second: string): string {
  return contrast(background, first) >= contrast(background, second) ? first : second
}

function contrast(first: string, second: string): number {
  const light = Math.max(relativeLuminance(first), relativeLuminance(second))
  const dark = Math.min(relativeLuminance(first), relativeLuminance(second))
  return (light + 0.05) / (dark + 0.05)
}

function relativeLuminance(color: string): number {
  const channel = (offset: number) => {
    const value = Number.parseInt(color.slice(offset, offset + 2), 16) / 255
    return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4
  }
  return 0.2126 * channel(1) + 0.7152 * channel(3) + 0.0722 * channel(5)
}

function normalizedFontStack(value: string, fallback: string): string {
  return value.trim().replace(/[;,]+$/, '') || fallback
}

export function normalizeWallLabel(value: string | undefined): string {
  const normalized = (value ?? '').replaceAll('[', '').replaceAll(']', '').trim().slice(0, 32)
  return normalized || DEFAULT_WALL_LABEL
}

function isThemeSettings(value: unknown): value is ThemeSettings {
  if (!value || typeof value !== 'object') return false
  const candidate = value as Partial<ThemeSettings>
  if (
    typeof candidate.presetId !== 'string' ||
    typeof candidate.editorialFont !== 'string' ||
    typeof candidate.uiFont !== 'string' ||
    typeof candidate.codeFont !== 'string' ||
    (candidate.wallLabel !== undefined && typeof candidate.wallLabel !== 'string')
  ) return false
  if (!candidate.colors || typeof candidate.colors !== 'object') return false
  return [...ANSI_KEYS, ...META_KEYS].every((key) => HEX.test(candidate.colors?.[key] ?? ''))
}

function isLegacyThemeSettings(value: unknown): value is Omit<ThemeSettings, 'editorialFont'> {
  if (!value || typeof value !== 'object') return false
  const candidate = value as Partial<ThemeSettings>
  if (typeof candidate.presetId !== 'string' || typeof candidate.uiFont !== 'string' || typeof candidate.codeFont !== 'string') return false
  if (!candidate.colors || typeof candidate.colors !== 'object') return false
  return [...ANSI_KEYS, ...META_KEYS].every((key) => HEX.test(candidate.colors?.[key] ?? ''))
}
