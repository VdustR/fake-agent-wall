import { writable } from 'svelte/store'
import { readSystemFonts, type FontOption } from './font-autocomplete'

interface CatalogState {
  fonts: FontOption[]
  status: 'idle' | 'loading' | 'ready' | 'error'
  message: string
}

/** Session memory only; enumeration never owns or mutates a settings draft. */
export function createSystemFontCatalog(read = readSystemFonts) {
  const state = writable<CatalogState>({ fonts: [], status: 'idle', message: '' })
  let pending: Promise<void> | undefined
  function load(): Promise<void> {
    if (pending) return pending
    state.update((value) => ({ ...value, status: 'loading', message: 'Allow font access in your browser.' }))
    pending = read().then((fonts) => {
      state.set({ fonts, status: 'ready', message: fonts.length
        ? `${fonts.length} system font ${fonts.length === 1 ? 'family' : 'families'} available`
        : 'No system fonts returned. Enter a font name.' })
    }).catch((error: unknown) => {
      state.update((value) => ({ ...value, status: 'error', message: error instanceof Error && error.message === 'unsupported'
        ? 'System font discovery is unsupported. Enter a font name.'
        : 'Font access unavailable. Retry or enter any font name.' }))
    }).finally(() => { pending = undefined })
    return pending
  }
  return { subscribe: state.subscribe, load }
}

export const systemFontCatalog = createSystemFontCatalog()
