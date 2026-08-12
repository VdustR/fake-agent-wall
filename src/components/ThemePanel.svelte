<script lang="ts">
  import { tick } from 'svelte'
  import {
    allPresets,
    ANSI_KEYS,
    cloneTheme,
    META_KEYS,
    settingsFromPreset,
    type AnsiKey,
    type MetaKey,
    type ThemePreset,
    type ThemeSettings,
  } from '../lib/theme'

  interface Props {
    value: ThemeSettings
    onpreview: (theme: ThemeSettings) => void
    onapply: (theme: ThemeSettings) => boolean
    oncancel: () => void
  }

  let { value, onpreview, onapply, oncancel }: Props = $props()
  // The panel is remounted for every editing session, so the prop is the draft snapshot.
  // svelte-ignore state_referenced_locally
  let draft = $state(cloneTheme(value))
  let search = $state('')
  let saveError = $state(false)
  let searchInput = $state<HTMLInputElement>()

  const visiblePresets = $derived.by(() => {
    const query = search.trim().toLocaleLowerCase()
    return query ? allPresets.filter((preset) => preset.name.toLocaleLowerCase().includes(query)) : allPresets
  })

  $effect(() => {
    void tick().then(() => searchInput?.focus())
  })

  function choosePreset(preset: ThemePreset): void {
    const fonts = { uiFont: draft.uiFont, codeFont: draft.codeFont }
    draft = { ...settingsFromPreset(preset), ...fonts }
    onpreview(cloneTheme(draft))
  }

  function updateColor(key: AnsiKey | MetaKey, color: string): void {
    draft.colors[key] = color
    onpreview(cloneTheme(draft))
  }

  function updateFont(kind: 'uiFont' | 'codeFont', family: string): void {
    draft[kind] = family
    onpreview(cloneTheme(draft))
  }

  function resetPreset(): void {
    const preset = allPresets.find((candidate) => candidate.id === draft.presetId) ?? allPresets[0]!
    choosePreset(preset)
  }

  function applyDraft(): void {
    saveError = !onapply(cloneTheme(draft))
  }
</script>

<aside class="theme-panel" aria-label="Theme settings">
  <header>
    <div>
      <h1>Theme</h1>
      <p>iTerm palette · live preview</p>
    </div>
    <button class="close" type="button" onclick={oncancel} aria-label="Close and discard changes">×</button>
  </header>

  <div class="panel-body">
    <section class="preset-section">
      <label class="field-label" for="preset-search">Preset</label>
      <input bind:this={searchInput} id="preset-search" type="search" bind:value={search} placeholder="Search 534 presets" autocomplete="off" />
      <div class="preset-list" aria-label="Theme presets">
        {#each visiblePresets as preset (preset.id)}
          <button class:active={preset.id === draft.presetId} type="button" onclick={() => choosePreset(preset)}>
            <span>{preset.name}</span>
            <span class="swatches" aria-hidden="true">
              {#each [preset.metadata.background, preset.scheme.red, preset.scheme.green, preset.scheme.blue] as color}
                <i style:background={color}></i>
              {/each}
            </span>
          </button>
        {/each}
      </div>
    </section>

    <section>
      <div class="section-head">
        <h2>Colors</h2>
        <button class="text-button" type="button" onclick={resetPreset}>Reset preset</button>
      </div>
      <div class="color-grid primary-colors">
        {#each META_KEYS as key}
          <label>
            <span>{key}</span>
            <span class="color-control">
              <input type="color" value={draft.colors[key]} oninput={(event) => updateColor(key, event.currentTarget.value)} />
              <code>{draft.colors[key]}</code>
            </span>
          </label>
        {/each}
      </div>
      <h3>ANSI</h3>
      <div class="color-grid ansi-colors">
        {#each ANSI_KEYS as key}
          <label title={key}>
            <span>{key.replace('bright', '+')}</span>
            <input type="color" value={draft.colors[key]} oninput={(event) => updateColor(key, event.currentTarget.value)} />
          </label>
        {/each}
      </div>
    </section>

    <section>
      <h2>Typography</h2>
      <label class="font-field">
        <span>UI font family</span>
        <input value={draft.uiFont} oninput={(event) => updateFont('uiFont', event.currentTarget.value)} spellcheck="false" />
        <output style:font-family={`${draft.uiFont}, ui-monospace, monospace`}>SWARM BUS · 012345</output>
      </label>
      <label class="font-field">
        <span>Code font family</span>
        <input value={draft.codeFont} oninput={(event) => updateFont('codeFont', event.currentTarget.value)} spellcheck="false" />
        <output style:font-family={`${draft.codeFont}, ui-monospace, monospace`}>⏺ Read(src/App.svelte)</output>
      </label>
      <p class="fallback">Fallback: ui-monospace, monospace</p>
    </section>
  </div>

  <footer>
    <span class:error={saveError}>{saveError ? 'Could not save · check browser storage' : ''}</span>
    <div>
      <button class="secondary" type="button" onclick={oncancel}>Cancel</button>
      <button class="apply" type="button" onclick={applyDraft}>Apply</button>
    </div>
  </footer>
</aside>

<style>
  .theme-panel { position: fixed; z-index: 100; inset: 0 0 0 auto; width: min(460px, 100vw); display: flex; flex-direction: column; color: var(--txt); background: var(--ink-050); border-left: 1px solid var(--line-hi); font-family: var(--f-umd); cursor: default; user-select: text; }
  header, footer { flex: none; display: flex; align-items: center; justify-content: space-between; background: var(--ink-150); border-color: var(--line-hi); }
  header { height: 62px; padding: 0 16px 0 20px; border-bottom: 1px solid var(--line-hi); }
  h1 { font-size: 16px; line-height: 1; text-transform: uppercase; letter-spacing: .08em; }
  header p { margin-top: 7px; color: var(--txt-fnt); font: 10px/1 var(--f-term); }
  button, input { font: inherit; }
  button { color: inherit; border: 0; }
  .close { width: 34px; height: 34px; background: transparent; color: var(--txt-dim); font: 24px/1 var(--f-term); cursor: pointer; }
  .close:hover { color: var(--txt-hi); background: var(--ink-200); }
  .panel-body { flex: 1; min-height: 0; overflow-y: auto; scrollbar-color: var(--line-hi) var(--ink-050); }
  section { padding: 18px 20px 20px; border-bottom: 1px solid var(--line); }
  h2, .field-label { display: block; color: var(--umd); font-size: 10px; line-height: 1; letter-spacing: .1em; text-transform: uppercase; }
  h3 { margin-top: 18px; color: var(--txt-fnt); font-size: 9px; text-transform: uppercase; letter-spacing: .12em; }
  .section-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; }
  input[type='search'], .font-field input { width: 100%; height: 36px; margin-top: 10px; padding: 0 10px; color: var(--txt-hi); background: var(--ink-000); border: 1px solid var(--line-hi); border-radius: 2px; outline: none; font-family: var(--f-term); }
  input:focus-visible, button:focus-visible { outline: 1px solid var(--coral); outline-offset: 2px; }
  .preset-list { height: 178px; margin-top: 8px; overflow-y: auto; border: 1px solid var(--line); background: var(--ink-000); scrollbar-color: var(--line-hi) var(--ink-000); }
  .preset-list button { width: 100%; min-height: 34px; display: flex; align-items: center; justify-content: space-between; padding: 0 10px; color: var(--txt-dim); background: transparent; border-bottom: 1px solid var(--line); font: 11px/1.2 var(--f-term); text-align: left; cursor: pointer; }
  .preset-list button:hover { color: var(--txt-hi); background: var(--ink-150); }
  .preset-list button.active { color: var(--on-coral); background: var(--coral); }
  .swatches { display: grid; grid-template-columns: repeat(4, 10px); height: 10px; border: 1px solid color-mix(in oklch, currentColor 30%, transparent); }
  .swatches i { display: block; }
  .text-button { padding: 4px 0; color: var(--coral); background: transparent; font: 10px/1 var(--f-term); cursor: pointer; }
  .color-grid { display: grid; gap: 8px; }
  .primary-colors { grid-template-columns: repeat(2, 1fr); }
  .color-grid label { color: var(--txt-fnt); font: 9px/1 var(--f-term); text-transform: uppercase; }
  .color-control { height: 32px; margin-top: 6px; display: flex; align-items: center; gap: 8px; background: var(--ink-000); border: 1px solid var(--line); }
  input[type='color'] { flex: none; width: 30px; height: 30px; padding: 0; border: 0; background: transparent; cursor: pointer; }
  code { color: var(--txt-dim); font: 10px/1 var(--f-term); }
  .ansi-colors { grid-template-columns: repeat(8, 1fr); margin-top: 8px; }
  .ansi-colors label { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .ansi-colors input { display: block; width: 100%; height: 28px; margin-top: 5px; }
  .font-field { display: block; margin-top: 14px; color: var(--txt-fnt); font-size: 9px; text-transform: uppercase; letter-spacing: .06em; }
  .font-field output { display: block; min-height: 38px; padding: 11px 10px; color: var(--txt-hi); background: var(--ink-100); border: 1px solid var(--line); font-size: 12px; text-transform: none; letter-spacing: 0; white-space: nowrap; overflow: hidden; }
  .fallback { margin-top: 10px; color: var(--txt-fnt); font: 9px/1 var(--f-term); }
  footer { min-height: 58px; padding: 0 16px 0 20px; border-top: 1px solid var(--line-hi); }
  footer > span { color: var(--txt-fnt); font: 9px/1 var(--f-term); }
  footer > span.error { color: var(--del); }
  footer div { display: flex; gap: 8px; }
  footer button { min-width: 82px; height: 32px; padding: 0 14px; border: 1px solid var(--line-hi); text-transform: uppercase; letter-spacing: .08em; font-size: 9px; cursor: pointer; }
  .secondary { background: var(--ink-100); }
  .apply { color: var(--on-coral); background: var(--coral); border-color: var(--coral); }
  @media (max-width: 520px) { .theme-panel { width: 100vw; } .ansi-colors { grid-template-columns: repeat(4, 1fr); } }
</style>
