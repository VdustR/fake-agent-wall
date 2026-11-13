import { describe, expect, it, vi } from 'vitest'
import { get } from 'svelte/store'
import { createSystemFontCatalog } from './system-font-catalog'
import { namedFont, type FontOption } from './font-autocomplete'

describe('session font catalog', () => {
  it('shares one pending read and exposes successful results to later subscribers', async () => {
    let resolve: ((fonts: FontOption[]) => void) | undefined
    const read = vi.fn(() => new Promise<FontOption[]>((done) => { resolve = done }))
    const catalog = createSystemFontCatalog(read)
    const pending = catalog.load()
    expect(catalog.load()).toBe(pending)
    expect(get(catalog).status).toBe('loading')
    expect(read).toHaveBeenCalledTimes(1)
    resolve?.([namedFont('System Face', 'System')])
    await pending
    expect(get(catalog).fonts.map((font) => font.label)).toEqual(['System Face'])
    expect(get(catalog).status).toBe('ready')
  })

  it('allows retry after rejection without discarding a previously loaded catalog', async () => {
    const read = vi.fn<() => Promise<FontOption[]>>()
      .mockResolvedValueOnce([namedFont('Retained Face', 'System')])
      .mockRejectedValueOnce(new Error('denied'))
      .mockResolvedValueOnce([namedFont('Refreshed Face', 'System')])
    const catalog = createSystemFontCatalog(read)
    await catalog.load()
    await catalog.load()
    expect(get(catalog).status).toBe('error')
    expect(get(catalog).fonts[0]?.label).toBe('Retained Face')
    await catalog.load()
    expect(get(catalog).status).toBe('ready')
    expect(get(catalog).fonts[0]?.label).toBe('Refreshed Face')
  })
})
