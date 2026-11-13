import { formatHex, interpolate, modeLrgb, modeOklab, modeOklch, modeRgb, useMode, wcagContrast } from 'culori/fn'
import type { Color } from 'culori'
import type { ThemeColors } from './theme'

// Register only the spaces used by the validated hex palette and CSS surfaces.
useMode(modeRgb)
useMode(modeLrgb)
useMode(modeOklab)
useMode(modeOklch)

export const INK_STEPS = { '000': 0, '050': .04, '100': .07, '150': .1, '200': .14 } as const

/** Derive reading ink without changing the preset's terminal or lamp palette. */
export function instrumentColors(colors: ThemeColors): Record<string, string> {
  const surface = interpolate([colors.background, colors.foreground], 'oklch')
  return {
    '--readout-050': readableSignal(surface(INK_STEPS['050']), colors.brightYellow, 4.56),
    '--readout-100': readableSignal(surface(INK_STEPS['100']), colors.brightYellow, 4.56),
    '--readout-150': readableSignal(surface(INK_STEPS['150']), colors.brightYellow, 4.56),
    '--plot-primary': readableSignal(surface(INK_STEPS['100']), colors.green, 3.05),
    '--plot-secondary': readableSignal(surface(INK_STEPS['100']), colors.brightYellow, 3.05),
  }
}

function readableSignal(surface: Color, signal: string, target: number): string {
  if (wcagContrast(surface, signal) >= target) return signal
  const endpoint = wcagContrast(surface, '#000000') >= wcagContrast(surface, '#ffffff') ? '#000000' : '#ffffff'
  const blend = interpolate([signal, endpoint], 'oklab')
  let low = 0
  let high = 1
  let result = endpoint
  // Test the serialized color, with a small margin for browser surface rounding.
  for (let step = 0; step < 18; step++) {
    const middle = (low + high) / 2
    const candidate = formatHex(blend(middle))
    if (wcagContrast(surface, candidate) >= target) {
      high = middle
      result = candidate
    } else low = middle
  }
  return result
}
