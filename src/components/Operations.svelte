<script lang="ts">
  import { onMount } from 'svelte'
  import type { OperationsWorld, OpsCardId } from '../lib/operations.svelte'
  import RollingNumber from './RollingNumber.svelte'

  interface Props { world: OperationsWorld; kind: OpsCardId }
  const { world, kind }: Props = $props()
  let tileElement = $state<HTMLElement>()
  let visibleRowCount = $state(3)
  const tasks = $derived(world.tasksFor(kind, visibleRowCount))
  const providers = $derived(world.providers.slice(0, visibleRowCount))
  const fleetAgents = $derived(world.fleetAgents.slice(0, visibleRowCount))

  onMount(() => {
    const observer = new ResizeObserver(([entry]) => {
      if (!entry) return
      const height = entry.contentRect.height
      const rowHeight = kind === 'fleet' || kind === 'resets' ? 31 : kind === 'usage' ? 47 : kind === 'cost' ? 43 : 52
      const reserved = kind === 'cost' ? 58 : 28
      visibleRowCount = Math.max(1, Math.min(12, Math.floor((height - reserved) / rowHeight)))
    })
    if (tileElement) observer.observe(tileElement)
    return () => observer.disconnect()
  })
</script>

<article class="ops-tile" data-kind={kind} bind:this={tileElement}>
  <header class="umd-type">
    <span>{world.titleFor(kind)}</span>
    <b>sim · live</b>
  </header>

  {#if kind === 'contributions'}
    <div class="matrix" aria-label="Synthetic contribution activity">
      {#each world.contributions as level}
        <i data-level={level}></i>
      {/each}
    </div>
    <footer class="stats umd-type"><b><RollingNumber value={world.contributionTotal.toLocaleString()} label={`${world.contributionTotal} events`} /></b> events · <b>{world.activeAgent}</b> active</footer>
  {:else if kind === 'usage'}
    <div class="usage">
      {#each providers as provider}
        <div><span>{provider.name}<small>{provider.model}</small></span><i><em style:transform={`scaleX(${provider.used / 100})`}></em></i><b><RollingNumber value={`${provider.used}%`} label={`${provider.used} percent used`} /><small>{provider.rpm} rpm · {provider.latency} ms</small></b></div>
      {/each}
    </div>
  {:else if kind === 'cost'}
    <div class="ledger">
      {#each providers as provider}
        <div><span>{provider.name}<small>{provider.tokens} tokens</small></span><b>{provider.cost}</b></div>
      {/each}
      <footer><span>projected session</span><strong><RollingNumber value={`$${world.estimatedCost.toFixed(2)}`} label={`${world.estimatedCost.toFixed(2)} dollars`} /></strong></footer>
    </div>
  {:else if kind === 'resets'}
    <div class="resets">
      {#each providers as provider, index}
        <div><i class:soon={index === world.epoch % 3}></i><span>{provider.name}<small>{index === world.epoch % 3 ? 'window nearing limit' : 'nominal routing'}</small></span><b>{provider.reset}</b></div>
      {/each}
    </div>
  {:else if kind === 'fleet'}
    <div class="fleet">
      {#each fleetAgents as agent}
        <div>
          <i data-state={agent.status}></i>
          <span>{agent.numLabel} · {agent.label}<small>{agent.provider} / {agent.model}</small></span>
          <b>{Math.round(agent.contextLeft)}%</b>
        </div>
      {/each}
    </div>
  {:else}
    <div class="tasks">
      {#each tasks as task (task.id)}
        <div class="task">
          <span class="id tnum">{task.id}</span>
          <strong>{task.title}</strong>
          <span class="agent"><i class:working={task.phase !== 'queued'}></i>{task.agent}</span>
          <em data-phase={task.phase}>{task.phase}</em>
        </div>
      {/each}
    </div>
  {/if}
</article>

<style>
  .ops-tile { height: 100%; min-height: 0; display: flex; flex-direction: column; overflow: hidden; background: var(--ink-050); border: 1.5px solid color-mix(in oklab, var(--coral) 55%, var(--line-hi)); }
  header { flex: none; display: flex; justify-content: space-between; align-items: center; height: clamp(19px, 1.65vw, 25px); padding: 0 7px; color: var(--txt-hi); background: var(--ink-150); border-bottom: 1px solid var(--line); letter-spacing: .08em; }
  header b { color: var(--coral); }
  .tasks { flex: 1; min-height: 0; overflow: hidden; }
  .task { display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: 4px 7px; padding: clamp(5px, .55vw, 8px); border-bottom: 1px solid var(--line); }
  .id { grid-column: 1; grid-row: 1; color: var(--coral); font-size: 8px; }
  .task strong { grid-column: 1 / -1; min-width: 0; color: var(--txt); font: 9px/1.2 var(--f-term); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .agent { grid-column: 1 / -1; display: flex; align-items: center; gap: 5px; color: var(--txt-fnt); font: 8px/1.2 var(--f-term); }
  .agent i { width: 5px; height: 5px; background: var(--txt-fnt); }
  .agent i.working { background: var(--cue); animation: pulse 900ms steps(2) infinite; }
  .task em { grid-column: 2; grid-row: 1; color: var(--txt-dim); font: 7px/1.2 var(--f-umd); font-style: normal; text-transform: uppercase; }
  .task em[data-phase='reviewing'], .task em[data-phase='merging'] { color: var(--amber); }
  .task em[data-phase='fixing'], .task em[data-phase='running'] { color: var(--cue); }
  .matrix { flex: 1; min-height: 0; display: grid; grid-template-rows: repeat(7, 1fr); grid-auto-flow: column; grid-auto-columns: 1fr; gap: 2px; padding: 9px; }
  .matrix i { background: var(--ink-150); }
  .matrix i[data-level='1'] { background: color-mix(in oklch, var(--cue) 24%, var(--ink-100)); }
  .matrix i[data-level='2'] { background: color-mix(in oklch, var(--cue) 48%, var(--ink-100)); }
  .matrix i[data-level='3'] { background: color-mix(in oklch, var(--cue) 72%, var(--ink-100)); }
  .matrix i[data-level='4'] { background: var(--cue); }
  .stats { flex: none; padding: 5px 8px; color: var(--txt-fnt); border-top: 1px solid var(--line); }
  .stats b { color: var(--txt-hi); }
  .usage { flex: 1; min-height: 0; padding: 4px 8px; overflow: hidden; }
  .usage > div { display: grid; grid-template-columns: minmax(0, 1fr) auto; align-items: center; gap: 4px 6px; padding: 5px 0; border-bottom: 1px solid var(--line); }
  .usage span, .usage small { display: block; min-width: 0; color: var(--txt); font: 8px/1.2 var(--f-term); overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }
  .usage small { margin-top: 2px; color: var(--txt-fnt); font-size: 7px; }
  .usage i { grid-column: 1 / -1; height: 4px; background: var(--ink-200); }
  .usage em { display: block; width: 100%; height: 100%; transform-origin: left; background: var(--cue); transition: transform 600ms cubic-bezier(.2, 0, 0, 1); }
  .usage b { grid-column: 2; grid-row: 1; color: var(--amber); font: 8px/1.2 var(--f-umd); text-align: right; }
  .usage b small { color: var(--txt-fnt); white-space: nowrap; }
  .ledger, .resets, .fleet { flex: 1; min-height: 0; overflow: hidden; padding: 3px 8px; }
  .ledger > div, .resets > div { display: grid; grid-template-columns: minmax(0, 1fr) auto; align-items: center; gap: 8px; padding: 6px 0; border-bottom: 1px solid var(--line); }
  .ledger span, .resets span { min-width: 0; color: var(--txt); font: 8px/1.2 var(--f-term); }
  .ledger small, .resets small { display: block; margin-top: 3px; color: var(--txt-fnt); font-size: 7px; }
  .ledger b, .resets b { color: var(--amber); font: 9px/1.2 var(--f-umd); font-variant-numeric: tabular-nums; }
  .ledger footer { display: flex; justify-content: space-between; align-items: end; padding: 7px 0 4px; color: var(--txt-fnt); font: 7px/1.2 var(--f-umd); text-transform: uppercase; }
  .ledger footer strong { color: var(--txt-hi); font: 12px/1.2 var(--f-umd); font-variant-numeric: tabular-nums; }
  .resets > div { grid-template-columns: auto minmax(0, 1fr) auto; }
  .resets i { width: 6px; height: 6px; background: var(--cue); }
  .resets i.soon { background: var(--hold); animation: pulse 900ms steps(2) infinite; }
  .fleet > div { display: grid; grid-template-columns: auto minmax(0, 1fr) auto; align-items: center; gap: 6px; padding: 5px 0; border-bottom: 1px solid var(--line); }
  .fleet i { width: 5px; height: 5px; background: var(--live); }
  .fleet i[data-state='hold'] { background: var(--hold); }
  .fleet i[data-state='done'] { background: var(--done); }
  .fleet span { min-width: 0; color: var(--txt); font: 8px/1.2 var(--f-term); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .fleet small { display: block; margin-top: 3px; color: var(--txt-fnt); font-size: 7px; overflow: hidden; text-overflow: ellipsis; }
  .fleet b { color: var(--amber); font: 8px/1.2 var(--f-umd); font-variant-numeric: tabular-nums; }
  @keyframes pulse { 50% { opacity: .35; } }
  @media (prefers-reduced-motion: reduce) {
    .agent i.working, .resets i.soon { animation: none; }
    .usage em { transition: none; }
  }
</style>
