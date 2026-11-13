import { describe, expect, it } from 'vitest'
import { familyKey, replaceFamily, stackContext } from './font-autocomplete'

describe('font stack autocomplete', () => {
  it('completes a family at the caret while preserving fallbacks and surrounding formatting', () => {
    const value = 'Georgia, bar con, monospace'
    expect(replaceFamily(value, 12, '"Barlow Condensed"').value).toBe('Georgia, "Barlow Condensed", monospace')
  })

  it('does not split commas inside quoted names or functions', () => {
    const value = '"ACME, Inc", var(--fallback, serif), mon xen'
    const context = stackContext(value, value.length)
    expect(context.query).toBe('mon xen')
    expect(replaceFamily(value, value.length, '"Monaspace Xenon"').value).toBe('"ACME, Inc", var(--fallback, serif), "Monaspace Xenon"')
    expect(stackContext(value, 22).searchable).toBe(false)
  })

  it('treats equivalent family spellings as selected while keeping generic keywords distinct', () => {
    expect(familyKey('"Barlow Condensed"')).toBe(familyKey('barlow condensed'))
    expect(familyKey("'serif'")).not.toBe(familyKey('serif'))
    const selected = stackContext('"Barlow Condensed", serif, ', 26).selected
    expect(selected.has(familyKey('barlow condensed'))).toBe(true)
    expect(selected.has('generic:serif')).toBe(true)
    expect(selected.has('family:serif')).toBe(false)
  })

  it('canonicalizes CSS escapes without collapsing whitespace in quoted names', () => {
    expect(familyKey('"Barlow\\20 Condensed"')).toBe(familyKey('Barlow Condensed'))
    expect(familyKey('Barlow\\ Condensed')).toBe(familyKey('"Barlow Condensed"'))
    expect(familyKey('"A  B"')).not.toBe(familyKey('A B'))
    expect(familyKey('"A\\22 B"')).toBe(familyKey(`'A"B'`))
    expect(familyKey('se\\72 if')).toBe('generic:serif')
    expect(familyKey('"serif"')).toBe('family:serif')
  })

  it('suppresses completion across a separator, but supports selection within a family', () => {
    const value = 'bar con, Unknown Two, monospace'
    expect(stackContext(value, 0, 20).searchable).toBe(false)
    expect(stackContext(value, 0, 5).searchable).toBe(true)
    expect(stackContext('"ACME, Inc", monospace', 1, 10).searchable).toBe(true)
  })

  it('inserts a new family after a trailing comma without changing preceding text', () => {
    const value = "'ACME, Inc', monospace, "
    expect(replaceFamily(value, value.length, '"Custom Face"').value).toBe("'ACME, Inc', monospace, \"Custom Face\"")
  })
})
