<script lang="ts">
  import { onMount } from 'svelte'
  import ExitHint from './components/ExitHint.svelte'
  import Pgm from './components/Pgm.svelte'
  import StatusLine from './components/StatusLine.svelte'
  import Telemetry from './components/Telemetry.svelte'
  import Ticker from './components/Ticker.svelte'
  import Tile from './components/Tile.svelte'
  import { Swarm } from './lib/swarm.svelte'

  const swarm = new Swarm()

  onMount(() => {
    swarm.start()
    return () => swarm.stop()
  })

  const beat = $derived(swarm.uptimeMs)
  // The desktop shell hides the pointer and owns the exit gesture; in a plain
  // browser tab neither applies and the page behaves like an ordinary page.
  const desktop = typeof window !== 'undefined' && window.agentWall?.isDesktop === true
  const onAir = $derived(swarm.agents[swarm.pgm] ?? swarm.agents[0]!)
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

    <div class="grid">
      {#each swarm.agents as a, i (a.slot)}
        <Tile agent={a} {beat} onAir={i === swarm.pgm} cued={i === swarm.pst} calm={swarm.reducedMotion} />
      {/each}
    </div>
  </div>

  <Ticker {swarm} />
  {#if desktop}<ExitHint />{/if}
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
    grid-template-columns: repeat(3, minmax(0, 1fr));
    grid-template-rows: repeat(3, minmax(0, 1fr));
    gap: var(--gap);
    min-height: 0;
  }


  @media (max-width: 1080px) {
    .wall {
      grid-template-columns: minmax(0, 1fr);
      grid-template-rows: minmax(0, 52fr) minmax(0, 48fr);
    }
    .grid {
      grid-template-columns: repeat(3, minmax(0, 1fr));
      grid-template-rows: repeat(3, minmax(0, 1fr));
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
  }
</style>
