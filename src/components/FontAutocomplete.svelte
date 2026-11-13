<script lang="ts">
  import { untrack } from 'svelte'
  import * as combobox from '@zag-js/combobox'
  import { useMachine, normalizeProps } from '@zag-js/svelte'
  import { createFontInputMachine } from '../lib/font-input-machine'
  import { Combobox, createListCollection } from '@ark-ui/svelte/combobox'
  import { Portal } from '@ark-ui/svelte/portal'
  import { createVirtualizer, defaultRangeExtractor } from '@tanstack/svelte-virtual'
  import fuzzysort from 'fuzzysort'
  import { replaceFamily, stackContext, type FontOption } from '../lib/font-autocomplete'

  interface Props { label: string; value: string; options: FontOption[]; onchange: (value: string) => void; onescape: () => void }
  let { label, value, options, onchange, onescape }: Props = $props()
  let input = $state<HTMLInputElement | null>(null)
  let scroller = $state<HTMLDivElement | null>(null)
  let caret = $state(0)
  let open = $state(false)
  let highlightedValue = $state<string | null>(null)
  let selectionEnd = $state(0)
  let composing = $state(false)
  const context = $derived(stackContext(value, caret, selectionEnd))
  const results = $derived.by(() => {
    if (!context.searchable || composing) return []
    const available = options.filter((font) => !context.selected.has(font.value))
    const exactSelected = options.some((font) => font.label.toLowerCase() === context.query.toLowerCase() && context.selected.has(font.value))
    const query = exactSelected ? '' : context.query
    return query ? fuzzysort.go(query, available, { key: 'label', threshold: .2 }).map((result) => result.obj) : available
  })
  const collection = $derived(createListCollection({ items: results, itemToValue: (font) => font.value, itemToString: (font) => font.label }))
  const virtualizer = createVirtualizer<HTMLDivElement, HTMLDivElement>({ count: 0, getScrollElement: () => scroller, estimateSize: () => 48, overscan: 3 })
  $effect(() => {
    const count = results.length
    const element = scroller
    const active = results.findIndex((font) => font.value === highlightedValue)
    untrack(() => $virtualizer.setOptions({
      count, getScrollElement: () => element,
      getItemKey: (index) => results[index]?.value ?? index,
      rangeExtractor: (range) => [...new Set([...defaultRangeExtractor(range), ...(active < 0 ? [] : [active])])].toSorted((a, b) => a - b),
    }))
  })
  function syncCaret() {
    caret = input?.selectionStart ?? value.length
    selectionEnd = input?.selectionEnd ?? caret
  }
  function choose(id: string | undefined) {
    syncCaret()
    if (!context.searchable || composing || !input) return
    const font = results.find((option) => option.value === id)
    if (!font) return
    const replacement = replaceFamily(value, caret, font.css)
    input.value = replacement.value
    input.focus()
    input.setSelectionRange(replacement.caret, replacement.caret)
    onchange(replacement.value)
    syncCaret()
    open = false
    highlightedValue = null
  }
  const id = $props.id()
  const service = useMachine(createFontInputMachine(() => input), (): combobox.Props<FontOption> => ({
    id, collection, inputValue: value, value: [], open, highlightedValue,
    inputBehavior: 'none', selectionBehavior: 'preserve', openOnClick: false,
    positioning: { placement: 'bottom-start', sameWidth: true, strategy: 'fixed', gutter: 4 },
    onOpenChange: (details) => { open = details.open && context.searchable && !composing },
    onHighlightChange: (details) => { highlightedValue = details.highlightedValue },
    onInputValueChange: (details) => { syncCaret(); onchange(details.inputValue) },
    onValueChange: (details) => choose(details.value[0]),
    scrollToIndexFn: ({ index }) => $virtualizer.scrollToIndex(index, { align: 'auto' }),
  }))
  const api = $derived(combobox.connect(service, normalizeProps))
  $effect(() => { if (!context.searchable || composing) { open = false; highlightedValue = null } })
</script>

<svelte:window onresize={() => {
  open = false
  if (input && document.activeElement === input) input.scrollIntoView({ block: 'nearest' })
}} />

<Combobox.RootProvider value={() => api} onkeydowncapture={(event) => {
  if (composing || event.isComposing || event.keyCode === 229) {
    event.stopPropagation()
    return
  }
  if ((event.key === 'Home' || event.key === 'End') && !event.altKey) {
    event.stopPropagation()
    return
  }
  if (!context.searchable && ['ArrowDown', 'ArrowUp', 'Enter'].includes(event.key)) {
    event.stopPropagation()
    return
  }
  if (event.key !== 'Escape') return
  event.preventDefault()
  event.stopPropagation()
  if (open) open = false
  else onescape()
}}>
  <Combobox.Label class="font-label">{label}</Combobox.Label>
  <Combobox.Control>
    <Combobox.Input bind:ref={input} class="font-input" spellcheck="false" onselect={syncCaret} onclick={() => { syncCaret(); if (context.searchable && !composing) open = true }} oncompositionstart={() => { composing = true }} oncompositionend={() => { composing = false; syncCaret() }} />
  </Combobox.Control>
  <Portal>
    <Combobox.Positioner class="font-positioner">
      <Combobox.Content class="font-options">
        <div class="font-scroll" bind:this={scroller}>
          <div class="font-space" style:height={`${$virtualizer.getTotalSize()}px`}>
            {#each $virtualizer.getVirtualItems() as row (row.key)}
              {@const font = results[row.index]}
              {#if font}
                <Combobox.Item item={font} class="font-option" aria-setsize={results.length} aria-posinset={row.index + 1}
                  style={`height: ${row.size}px; transform: translateY(${row.start}px);`}>
                  <Combobox.ItemText class="font-name" style={`font-family: ${font.css}`} title={font.label}>{font.label}</Combobox.ItemText>
                  <span class="font-source">{font.source}</span>
                </Combobox.Item>
              {/if}
            {/each}
          </div>
          {#if results.length === 0}<p class="font-empty">No suggestions. You can keep typing any font name.</p>{/if}
        </div>
        <p class="font-hint">↑ ↓ to browse · Alt+Home/End for first/last · Esc to close</p>
      </Combobox.Content>
    </Combobox.Positioner>
  </Portal>
</Combobox.RootProvider>

<style>
  :global(.font-label) { display: block; color: var(--txt-fnt); font-size: 9px; text-transform: uppercase; letter-spacing: .06em; }
  :global(.font-input) { width: 100%; height: 36px; margin-top: 10px; padding: 0 10px; color: var(--txt-hi); background: var(--ink-000); border: 1px solid var(--line-hi); border-radius: 2px; outline: none; font: inherit; font-family: var(--f-term); }
  :global(.font-input:focus-visible) { outline: 1px solid var(--coral); outline-offset: 2px; }
  :global(.font-positioner) { z-index: 150; }
  :global(.font-options) { background: var(--ink-050); color: var(--txt-hi); border: 1px solid var(--line-hi); border-radius: 2px; font-family: var(--f-umd); }
  .font-scroll { max-height: 192px; height: 192px; overflow-y: auto; scrollbar-color: var(--line-hi) var(--ink-050); overscroll-behavior: contain; }
  .font-space { position: relative; }
  :global(.font-option) { position: absolute; top: 0; left: 0; width: 100%; display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 0 10px; border-bottom: 1px solid var(--line); cursor: pointer; }
  :global(.font-option[data-highlighted]) { background: var(--ink-200); outline: 1px solid var(--coral); outline-offset: -1px; }
  :global(.font-name) { font-size: 16px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .font-source { flex-shrink: 0; color: var(--txt-dim); font-size: 10px; }
  .font-empty { padding: 12px 10px; color: var(--txt-dim); font: 11px/1.5 var(--f-umd); }
  .font-hint { margin: 0; padding: 8px 10px; border-top: 1px solid var(--line); color: var(--txt-dim); font: 10px/1.4 var(--f-umd); }
</style>
