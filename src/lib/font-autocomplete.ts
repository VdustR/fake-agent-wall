import valueParser from 'postcss-value-parser'
import { tokenize, isTokenIdent, isTokenString, isTokenWhitespace, isTokenComment, isTokenEOF } from '@csstools/css-tokenizer'

export interface FontOption {
  value: string
  label: string
  css: string
  source: 'App' | 'System' | 'CSS generic'
}

const genericNames = new Set(['serif', 'sans-serif', 'monospace', 'cursive', 'fantasy', 'system-ui', 'ui-serif', 'ui-sans-serif', 'ui-monospace', 'ui-rounded', 'math', 'fangsong'])

export function familyKey(token: string): string {
  const tokens = tokenize({ css: token }).filter((item) => !isTokenWhitespace(item) && !isTokenComment(item) && !isTokenEOF(item))
  const first = tokens[0]
  if (tokens.length === 1 && isTokenIdent(first) && genericNames.has(first[4].value.toLowerCase())) return `generic:${first[4].value.toLowerCase()}`
  const family = tokens.map((item) => isTokenString(item) || isTokenIdent(item) ? item[4].value : item[1]).join(' ')
  return `family:${family.toLowerCase()}`
}

export function stackContext(value: string, caret: number, selectionEnd = caret) {
  const commas = valueParser(value).nodes.filter((node) => node.type === 'div' && node.value === ',')
  const spans: { start: number; end: number }[] = []
  let start = 0
  for (const comma of commas) {
    spans.push({ start, end: comma.sourceIndex })
    start = comma.sourceEndIndex
  }
  spans.push({ start, end: value.length })
  const current = spans.find((span) => caret <= span.end) ?? spans[spans.length - 1]!
  const token = value.slice(current.start, current.end)
  const trimmed = token.trim()
  const nodes = valueParser(trimmed).nodes
  return {
    ...current,
    query: nodes.length === 1 && nodes[0]?.type === 'string' ? nodes[0].value : trimmed,
    searchable: !nodes.some((node) => node.type === 'function') && !commas.some((comma) => comma.sourceIndex >= Math.min(caret, selectionEnd) && comma.sourceIndex < Math.max(caret, selectionEnd)),
    selected: new Set(spans.map((span) => familyKey(value.slice(span.start, span.end)))),
  }
}

export function replaceFamily(value: string, caret: number, css: string) {
  const { start, end } = stackContext(value, caret)
  const token = value.slice(start, end)
  const leading = token.match(/^\s*/u)?.[0] ?? ''
  const trailing = token.trim() ? token.match(/\s*$/u)?.[0] ?? '' : ''
  const replacement = leading + css + trailing
  return { value: value.slice(0, start) + replacement + value.slice(end), caret: start + leading.length + css.length }
}

export function namedFont(label: string, source: 'App' | 'System'): FontOption {
  return { value: `family:${label.toLowerCase()}`, label, css: JSON.stringify(label), source }
}

export function defaultFontOptions(): FontOption[] {
  return [
    ...['Monaspace Xenon', 'Barlow Condensed', 'Cormorant Garamond'].map((name) => namedFont(name, 'App')),
    ...[...genericNames].filter((name) => CSS.supports('font-family', name)).map((label): FontOption => ({ value: `generic:${label}`, label, css: label, source: 'CSS generic' })),
  ]
}

export async function readSystemFonts(): Promise<FontOption[]> {
  if (!('queryLocalFonts' in window) || typeof window.queryLocalFonts !== 'function') throw new Error('unsupported')
  const result: unknown = await window.queryLocalFonts()
  if (!Array.isArray(result)) throw new Error('Invalid font catalog')
  const families = new Set<string>()
  for (const font of result) {
    if (font && typeof font === 'object' && 'family' in font && typeof font.family === 'string') families.add(font.family)
  }
  return [...families].toSorted((a, b) => a.localeCompare(b)).map((family) => namedFont(family, 'System'))
}
