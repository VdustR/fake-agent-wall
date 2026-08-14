<script lang="ts">
  import { onMount } from 'svelte'
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
  import { applyTheme, clearThemeSettings, cloneTheme, defaultTheme, loadTheme, normalizeWallLabel, saveTheme, type ThemeSettings } from './lib/theme'

  const swarm = new Swarm()
  const operations = new OperationsWorld(swarm)
  let themeOpen = $state(false)
  let committedTheme = $state<ThemeSettings>()
  let wallLabel = $state('fake-agent-wall')
  let gridElement = $state<HTMLDivElement>()

  onMount(() => {
    committedTheme = loadTheme()
    wallLabel = normalizeWallLabel(committedTheme.wallLabel)
    applyTheme(committedTheme)
    swarm.start()
    operations.start()
    let resizeFrame = 0
    let resizeSettled = 0
    const gridObserver = new ResizeObserver(([entry]) => {
      if (!entry) return
      clearTimeout(resizeSettled)
      cancelAnimationFrame(resizeFrame)
      const { width, height } = entry.contentRect
      resizeFrame = requestAnimationFrame(() => operations.setViewport(width, height))
      resizeSettled = window.setTimeout(() => operations.setViewport(width, height), 160)
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
      cancelAnimationFrame(resizeFrame)
      clearTimeout(resizeSettled)
      gridObserver.disconnect()
      window.removeEventListener('keydown', onKeydown, { capture: true })
      offToggle?.()
      offClose?.()
    }
  })

  function setThemeOpen(open: boolean): void {
    if (!open && committedTheme) {
      applyTheme(committedTheme)
      wallLabel = normalizeWallLabel(committedTheme.wallLabel)
    }
    themeOpen = open
    window.agentWall?.setThemePanelOpen(open)
  }

  function applyAndClose(theme: ThemeSettings): boolean {
    if (!saveTheme(theme)) return false
    committedTheme = cloneTheme(theme)
    wallLabel = committedTheme.wallLabel
    applyTheme(committedTheme)
    themeOpen = false
    window.agentWall?.setThemePanelOpen(false)
    return true
  }

  function restoreDefaults(): ThemeSettings | null {
    if (!clearThemeSettings()) return null
    committedTheme = cloneTheme(defaultTheme)
    wallLabel = committedTheme.wallLabel
    applyTheme(committedTheme)
    return cloneTheme(committedTheme)
  }

  const beat = $derived(swarm.uptimeMs)
  // The desktop shell hides the pointer and owns the exit gesture; in a plain
  // browser tab neither applies and the page behaves like an ordinary page.
  const desktop = typeof window !== 'undefined' && window.agentWall?.isDesktop === true
  const onAir = $derived(swarm.agents[swarm.pgm] ?? swarm.agents[0]!)
  const gridItems = $derived(operations.gridItems)
  $effect(() => {
    const slots = gridItems.flatMap(item => item.type === 'agent' && item.agent ? [item.agent.slot] : [])
    swarm.setVisibleSlots([...slots, onAir.slot])
  })
</script>

<main class="deck" class:desktop>
  <StatusLine {swarm} {wallLabel} />

    <div class="wall">
      <div
        class="grid"
        bind:this={gridElement}
        data-slot-capacity={operations.slotCount}
        data-layout-violations={operations.layoutViolations.join(',')}
      >
        {#each gridItems as item (item.key)}
          <div class="grid-item" style:grid-area={operations.placementFor(item.key)}>
            {#if item.type === 'pgm'}
              <Pgm
                agent={onAir}
                {beat}
                flash={swarm.flash}
                calm={swarm.reducedMotion}
                nextCutIn={swarm.nextCutIn}
                cueing={swarm.pst === -1 ? null : (swarm.agents[swarm.pst]?.numLabel ?? null)}
              />
            {:else if item.type === 'telemetry'}
              <Telemetry {swarm} />
            {:else if item.type === 'agent'}
              <Tile agent={item.agent!} {beat} onAir={item.agent!.slot === swarm.pgm} cued={item.agent!.slot === swarm.pst} calm={swarm.reducedMotion} />
            {:else}
              <Operations world={operations} kind={item.kind!} />
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
      onpreview={(theme) => { applyTheme(theme); wallLabel = theme.wallLabel || 'fake-agent-wall' }}
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
    display: block;
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

  .grid {
    display: grid;
    grid-template-columns: repeat(192, minmax(0, 1fr));
    grid-template-rows: repeat(192, minmax(0, 1fr));
    gap: 0;
    min-height: 0;
    height: 100%;
  }
  .grid-item {
    min-width: 0;
    min-height: 0;
    padding: calc(var(--gap) / 2);
  }
  .grid-item :global(> *) { height: 100%; }


</style>
