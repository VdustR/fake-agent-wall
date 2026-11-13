<script lang="ts">
  import SessionName from './SessionName.svelte'
  import ProcessTable from './ProcessTable.svelte'
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
    let observedRow: Element | null = null
    const observer = new ResizeObserver(() => {
      if (!tileElement) return
      const body = tileElement.querySelector<HTMLElement>('.tasks, .usage, .ledger, .resets, .fleet')
      const row = body?.querySelector<HTMLElement>(':scope > div')
      if (!body || !row) return
      if (observedRow !== row) {
        if (observedRow) observer.unobserve(observedRow)
        observedRow = row
        observer.observe(row)
      }
      const style = getComputedStyle(body)
      const footer = body.querySelector('footer')?.getBoundingClientRect().height ?? 0
      const available = body.clientHeight - parseFloat(style.paddingTop) - parseFloat(style.paddingBottom) - footer
      const rowHeight = row.getBoundingClientRect().height
      if (rowHeight > 0) visibleRowCount = Math.max(1, Math.min(12, Math.floor(available / rowHeight)))
    })
    if (tileElement) observer.observe(tileElement)
    return () => observer.disconnect()
  })
</script>

<article class="ops-tile" data-kind={kind} bind:this={tileElement}>
  <header class="umd-type">
    <span>{world.titleFor(kind)}</span>
  </header>

  {#if kind === 'processes'}
    <ProcessTable snapshot={world.swarm.host} />
  {:else if kind === 'contributions'}
    <div class="matrix" aria-label="Synthetic contribution activity">
      {#each world.contributions as level}
        <i data-level={level}></i>
      {/each}
    </div>
    <footer class="stats umd-type"><b><RollingNumber value={world.contributionTotal.toLocaleString()} label={`${world.contributionTotal} events`} /></b> events · <b>{world.activeAgent}</b> active</footer>
  {:else if kind === 'usage'}
    <div class="usage">
      {#each providers as provider (provider.name)}
        <div><span>{provider.name}<small>{provider.model}</small></span><i><em style:transform={`scaleX(${provider.used / 100})`}></em></i><b><RollingNumber value={`${provider.used}%`} label={`${provider.used} percent used`} /><small><RollingNumber value={provider.rpm} /> rpm · <RollingNumber value={provider.latency} /> ms</small></b></div>
      {/each}
    </div>
  {:else if kind === 'cost'}
    <div class="ledger">
      {#each providers as provider (provider.name)}
        <div><span>{provider.name}<small><RollingNumber value={provider.tokens} /> tokens</small></span><b><RollingNumber value={provider.cost} /></b></div>
      {/each}
      <footer><span>projected session</span><strong><RollingNumber value={`$${world.estimatedCost.toFixed(2)}`} label={`${world.estimatedCost.toFixed(2)} dollars`} /></strong></footer>
    </div>
  {:else if kind === 'resets'}
    <div class="resets">
      {#each providers as provider, index (provider.name)}
        <div><i class:soon={index === world.epoch % 3} class:activity-breathe={index === world.epoch % 3}></i><span>{provider.name}<small>{index === world.epoch % 3 ? 'window nearing limit' : 'nominal routing'}</small></span><b><RollingNumber value={provider.reset} /></b></div>
      {/each}
    </div>
  {:else if kind === 'fleet'}
    <div class="fleet">
      {#each fleetAgents as agent (agent.slot)}
        <div>
          <i style={`--breath-delay: -${agent.slot * 107}ms`} data-state={agent.status} class:activity-breathe={agent.status === 'run'}></i>
          <span><span class="fleet-session"><span>{agent.numLabel} ·&nbsp;</span><SessionName text={agent.label} active={agent.status === 'run' || agent.status === 'cue'} phase={agent.slot * 137} /></span><small>{agent.provider} / {agent.model}</small></span>
          <b><RollingNumber value={Math.round(agent.contextLeft)} />%</b>
        </div>
      {/each}
    </div>
  {:else}
    <div class="tasks">
      {#each tasks as task, index (task.id)}
        <div class="task">
          <span class="id tnum">{task.id}</span>
          <strong>{task.title}</strong>
          <span class="agent" style={`--breath-delay: -${index * 280}ms`}><i class:activity-breathe={task.phase !== 'queued'} class:working={task.phase !== 'queued'}></i><SessionName text={task.agent} active={task.phase !== 'queued'} phase={index * 731} /></span>
          <em data-phase={task.phase}>{task.phase}</em>
        </div>
      {/each}
    </div>
  {/if}
</article>

<style>
  .ops-tile { height: 100%; min-height: 0; display: flex; flex-direction: column; overflow: hidden; background: var(--ink-050); border: 1.5px solid color-mix(in oklab, var(--coral) 55%, var(--line-hi)); }
  header { flex: none; display: flex; justify-content: space-between; align-items: center; height: clamp(19px, 1.65vw, 25px); padding: 0 7px; color: var(--txt-hi); background: var(--ink-150); border-bottom: 1px solid var(--line); letter-spacing: .08em; }
  .tasks { flex: 1; min-height: 0; overflow: hidden; }
  .task { display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: 4px 7px; padding: clamp(5px, .55vw, 8px); border-bottom: 1px solid var(--line); }
  .id { grid-column: 1; grid-row: 1; color: var(--coral); font-size: 8px; }
  .task strong { grid-column: 1 / -1; min-width: 0; color: var(--txt); font: 9px/1.2 var(--f-term); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .agent { grid-column: 1 / -1; display: flex; align-items: center; gap: 5px; color: var(--txt-fnt); font: 8px/1.2 var(--f-term); }
  .agent i { width: 5px; height: 5px; background: var(--txt-fnt); }
  .agent i.working { background: var(--cue); }
  .task em { grid-column: 2; grid-row: 1; color: var(--txt-dim); font: 7px/1.2 var(--f-umd); font-style: normal; text-transform: uppercase; }
  .task em[data-phase='reviewing'], .task em[data-phase='merging'] { color: var(--readout-050); }
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
  .usage b { grid-column: 2; grid-row: 1; color: var(--readout-050); font: 8px/1.2 var(--f-umd); text-align: right; }
  .usage b small { color: var(--txt-fnt); white-space: nowrap; }
  .ledger, .resets, .fleet { flex: 1; min-height: 0; overflow: hidden; padding: 3px 8px; }
  .ledger > div, .resets > div { display: grid; grid-template-columns: minmax(0, 1fr) auto; align-items: center; gap: 8px; padding: 6px 0; border-bottom: 1px solid var(--line); }
  .ledger span, .resets span { min-width: 0; color: var(--txt); font: 8px/1.2 var(--f-term); }
  .ledger small, .resets small { display: block; margin-top: 3px; color: var(--txt-fnt); font-size: 7px; }
  .ledger b, .resets b { color: var(--readout-050); font: 9px/1.2 var(--f-umd); font-variant-numeric: tabular-nums; }
  .ledger footer { display: flex; justify-content: space-between; align-items: end; padding: 7px 0 4px; color: var(--txt-fnt); font: 7px/1.2 var(--f-umd); text-transform: uppercase; }
  .ledger footer strong { color: var(--txt-hi); font: 12px/1.2 var(--f-umd); font-variant-numeric: tabular-nums; }
  .resets > div { grid-template-columns: auto minmax(0, 1fr) auto; }
  .resets i { width: 6px; height: 6px; background: var(--cue); }
  .resets i.soon { background: var(--hold); }
  .fleet > div { display: grid; grid-template-columns: auto minmax(0, 1fr) auto; align-items: center; gap: 6px; padding: 5px 0; border-bottom: 1px solid var(--line); }
  .fleet i { width: 5px; height: 5px; background: var(--live); }
  .fleet i[data-state='hold'] { background: var(--hold); }
  .fleet i[data-state='done'] { background: var(--done); }
  .fleet span { min-width: 0; color: var(--txt); font: 8px/1.2 var(--f-term); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .fleet-session { display: flex; align-items: baseline; }
  .fleet-session > span { flex: none; }
  .fleet small { display: block; margin-top: 3px; color: var(--txt-fnt); font-size: 7px; overflow: hidden; text-overflow: ellipsis; }
  .fleet b { color: var(--readout-050); font: 8px/1.2 var(--f-umd); font-variant-numeric: tabular-nums; }
  @media (prefers-reduced-motion: reduce) {
    .agent i.working, .resets i.soon { animation: none; }
    .usage em { transition: none; }
  }
</style>
