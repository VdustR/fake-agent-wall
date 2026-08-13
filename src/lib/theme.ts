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
  uiFont: string
  codeFont: string
}

const STORAGE_KEY = 'fake-agent-wall.theme.v2'
const LEGACY_STORAGE_KEY = 'fake-agent-wall.theme.v1'
const HEX = /^#[0-9a-f]{6}$/i

export const presets = presetData.colors as ThemePreset[]

export const allPresets = presets

export function settingsFromPreset(preset: ThemePreset): ThemeSettings {
  return {
    presetId: preset.id,
    colors: { ...preset.scheme, ...pickMetadata(preset) },
    uiFont: "'Martian Mono'",
    codeFont: "'Iosevka'",
  }
}

const claudeDarkPreset = presets.find((preset) => preset.id === 'claude-dark')
if (!claudeDarkPreset) throw new Error('Bundled Claude Dark theme is missing')

export const defaultTheme = settingsFromPreset(claudeDarkPreset)

export function cloneTheme(theme: ThemeSettings): ThemeSettings {
  return { ...theme, colors: { ...theme.colors } }
}

export function loadTheme(): ThemeSettings {
  try {
    // v1 defaulted to the removed Swarmdeck palette. Drop it once so existing
    // installs receive Claude Dark; subsequent user choices persist under v2.
    localStorage.removeItem(LEGACY_STORAGE_KEY)
    const stored: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null')
    if (isThemeSettings(stored)) return cloneTheme(stored)
  } catch {
    // Invalid or unavailable storage should never stop the wall from playing.
  }
  return cloneTheme(defaultTheme)
}

export function saveTheme(theme: ThemeSettings): boolean {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(theme))
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
    '--f-umd': fontStack(theme.uiFont),
    '--f-term': `'GutterMark', ${fontStack(theme.codeFont)}`,
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

function fontStack(value: string): string {
  const trimmed = value.trim().replace(/[;,]+$/, '')
  return `${trimmed || 'ui-monospace'}, ui-monospace, monospace`
}

function isThemeSettings(value: unknown): value is ThemeSettings {
  if (!value || typeof value !== 'object') return false
  const candidate = value as Partial<ThemeSettings>
  if (typeof candidate.presetId !== 'string' || typeof candidate.uiFont !== 'string' || typeof candidate.codeFont !== 'string') return false
  if (!candidate.colors || typeof candidate.colors !== 'object') return false
  return [...ANSI_KEYS, ...META_KEYS].every((key) => HEX.test(candidate.colors?.[key] ?? ''))
}
