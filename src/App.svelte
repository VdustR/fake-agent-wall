<script lang="ts">
  import { onMount } from 'svelte'
  import { flip } from 'svelte/animate'
  import { cubicOut } from 'svelte/easing'
  import ExitHint from './components/ExitHint.svelte'
  import Operations from './components/Operations.svelte'
  import OpsNotice from './components/OpsNotice.svelte'
  import Pgm from './components/Pgm.svelte'
  import StatusLine from './components/StatusLine.svelte'
  import Telemetry from './components/Telemetry.svelte'
  import ThemePanel from './components/ThemePanel.svelte'
  import Ticker from './components/Ticker.svelte'
  import Tile from './components/Tile.svelte'
  import { Swarm } from './lib/swarm.svelte'
  import { OperationsWorld } from './lib/operations.svelte'
  import { applyTheme, clearThemeSettings, cloneTheme, defaultTheme, loadTheme, saveTheme, type ThemeSettings } from './lib/theme'

  const swarm = new Swarm()
  const operations = new OperationsWorld(swarm)
  let themeOpen = $state(false)
  let committedTheme = $state<ThemeSettings>()
  let gridElement = $state<HTMLDivElement>()

  onMount(() => {
    committedTheme = loadTheme()
    applyTheme(committedTheme)
    swarm.start()
    operations.start()
    const gridObserver = new ResizeObserver(([entry]) => {
      if (entry) operations.setViewport(entry.contentRect.width, entry.contentRect.height)
    })
    if (gridElement) gridObserver.observe(gridElement)

    const toggle = () => setThemeOpen(!themeOpen)
    const close = () => setThemeOpen(false)
    const onKeydown = (event: KeyboardEvent) => {
      const shortcut = (event.metaKey || event.ctrlKey) && event.shiftKey && event.code === 'Comma'
      if (shortcut) {
        event.preventDefault()
        event.stopPropagation()
        toggle()
      } else if (event.key === 'Escape' && themeOpen) {
        event.preventDefault()
        event.stopPropagation()
        close()
      }
    }
    window.addEventListener('keydown', onKeydown, { capture: true })
    const offToggle = window.agentWall?.onThemeToggle(toggle)
    const offClose = window.agentWall?.onThemeClose(close)

    return () => {
      swarm.stop()
      operations.stop()
      gridObserver.disconnect()
      window.removeEventListener('keydown', onKeydown, { capture: true })
      offToggle?.()
      offClose?.()
    }
  })

  function setThemeOpen(open: boolean): void {
    if (!open && committedTheme) applyTheme(committedTheme)
    themeOpen = open
    window.agentWall?.setThemePanelOpen(open)
  }

  function applyAndClose(theme: ThemeSettings): boolean {
    if (!saveTheme(theme)) return false
    committedTheme = cloneTheme(theme)
    applyTheme(committedTheme)
    themeOpen = false
    window.agentWall?.setThemePanelOpen(false)
    return true
  }

  function restoreDefaults(): ThemeSettings | null {
    if (!clearThemeSettings()) return null
    committedTheme = cloneTheme(defaultTheme)
    applyTheme(committedTheme)
    return cloneTheme(committedTheme)
  }

  const beat = $derived(swarm.uptimeMs)
  // The desktop shell hides the pointer and owns the exit gesture; in a plain
  // browser tab neither applies and the page behaves like an ordinary page.
  const desktop = typeof window !== 'undefined' && window.agentWall?.isDesktop === true
  const onAir = $derived(swarm.agents[swarm.pgm] ?? swarm.agents[0]!)
  const gridItems = $derived(operations.gridItems)
</script>

<main class="deck" class:desktop>
  <StatusLine {swarm} />

    <div class="wall">
      <div class="col">
        <Pgm
          agent={onAir}
          {beat}
          flash={swarm.flash}
          calm={swarm.reducedMotion}
          nextCutIn={swarm.nextCutIn}
          cueing={swarm.pst === -1 ? null : (swarm.agents[swarm.pst]?.numLabel ?? null)}
        />
        <Telemetry {swarm} />
      </div>

      <div class="grid" bind:this={gridElement}>
        {#each gridItems as item, index (item.key)}
          <div class="grid-item" style:grid-area={operations.placementAt(index)} animate:flip={{ duration: swarm.reducedMotion ? 0 : 680, easing: cubicOut }}>
            {#if item.type === 'agent'}
              <Tile agent={item.agent} {beat} onAir={item.agent.slot === swarm.pgm} cued={item.agent.slot === swarm.pst} calm={swarm.reducedMotion} />
            {:else}
              <Operations world={operations} kind={item.kind} />
            {/if}
          </div>
        {/each}
      </div>
    </div>

  <Ticker {swarm} />
  <OpsNotice notice={operations.notice} />
  {#if desktop}<ExitHint />{/if}
  {#if themeOpen && committedTheme}
    <ThemePanel
      value={committedTheme}
      onpreview={applyTheme}
      onapply={applyAndClose}
      onreset={restoreDefaults}
      oncancel={() => setThemeOpen(false)}
    />
  {/if}
</main>

<style>
  /* Kiosk playback: no pointer anywhere on the wall, and no text selection to
     be left highlighted by a stray click. */
  .deck.desktop,
  .deck.desktop :global(*) {
    cursor: none;
    user-select: none;
    -webkit-user-select: none;
  }

  .deck.desktop :global(.theme-panel),
  .deck.desktop :global(.theme-panel *) {
    cursor: auto;
    user-select: auto;
    -webkit-user-select: auto;
  }

  .deck {
    position: relative;
    display: flex;
    flex-direction: column;
    height: 100dvh;
    background: var(--ink-000);
  }

  .wall {
    position: relative;
    flex: 1;
    min-height: 0;
    display: grid;
    grid-template-columns: minmax(0, 41fr) minmax(0, 59fr);
    gap: var(--gap);
    padding: var(--gap);
    /* Faint rack-panel field so the tiles read as mounted, not floating. */
    background:
      radial-gradient(120% 90% at 50% 0%, rgba(120, 140, 165, 0.05), transparent 60%),
      var(--ink-000);
  }

  /* Registration crosses, the way an alignment chart marks the wall corners. */
  .wall::before,
  .wall::after {
    content: '';
    position: absolute;
    width: 11px;
    height: 11px;
    pointer-events: none;
    opacity: 0.5;
    background:
      linear-gradient(var(--line-hi), var(--line-hi)) 50% 0 / 1px 100% no-repeat,
      linear-gradient(var(--line-hi), var(--line-hi)) 0 50% / 100% 1px no-repeat;
  }
  .wall::before {
    top: 1px;
    left: 1px;
  }
  .wall::after {
    bottom: 1px;
    right: 1px;
  }

  .col {
    display: flex;
    flex-direction: column;
    gap: var(--gap);
    min-height: 0;
  }
  .col :global(> section:first-child) {
    flex: 1;
    min-height: 0;
  }

  .grid {
    display: grid;
    grid-template-columns: repeat(12, minmax(0, 1fr));
    grid-template-rows: repeat(12, minmax(0, 1fr));
    gap: var(--gap);
    min-height: 0;
  }
  .grid-item { min-width: 0; min-height: 0; will-change: transform; }
  .grid-item :global(> *) { height: 100%; }


  @media (max-width: 1080px) {
    .wall {
      grid-template-columns: minmax(0, 1fr);
      grid-template-rows: minmax(0, 52fr) minmax(0, 48fr);
    }
    .grid {
      grid-template-columns: repeat(12, minmax(0, 1fr));
      grid-template-rows: repeat(12, minmax(0, 1fr));
    }
  }

  @media (max-width: 720px) {
    .wall {
      grid-template-rows: minmax(0, 46fr) minmax(0, 54fr);
    }
    .grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
      grid-template-rows: repeat(5, minmax(0, 1fr));
    }
    .grid-item { grid-area: auto !important; }
    /* Nine feeds cannot fill a two-column matrix evenly. The final terminal
       becomes the wide closing source, so the mosaic always seals its bottom
       edge instead of leaving an accidental tenth-cell void. */
    .grid-item:last-child { grid-column: 1 / -1 !important; }
  }
  @media (prefers-reduced-motion: reduce) { .grid-item { will-change: auto; } }
</style>
