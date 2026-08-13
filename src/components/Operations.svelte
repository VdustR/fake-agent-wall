<script lang="ts">
  import type { OperationsWorld, OpsCardId } from '../lib/operations.svelte'
  import RollingNumber from './RollingNumber.svelte'

  interface Props { world: OperationsWorld; kind: OpsCardId }
  const { world, kind }: Props = $props()
  const tasks = $derived(world.tasksFor(kind))
</script>

<article class="ops-tile" data-kind={kind}>
  <header class="umd-type">
    <span>{world.titleFor(kind)}</span>
    <b>ops · live</b>
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
      {#each world.providers as provider}
        <div><span>{provider.name}<small>{provider.model}</small></span><i><em style:width={`${provider.used}%`}></em></i><b><RollingNumber value={`${provider.used}%`} label={`${provider.used} percent used`} /></b></div>
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
  .tasks { min-height: 0; overflow: hidden; }
  .task { display: grid; grid-template-columns: auto minmax(0, 1fr) auto; gap: 4px 7px; padding: clamp(5px, .55vw, 8px); border-bottom: 1px solid var(--line); }
  .id { color: var(--coral); font-size: 8px; }
  .task strong { min-width: 0; color: var(--txt); font: 9px/1.2 var(--f-term); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .agent { grid-column: 1 / 3; display: flex; align-items: center; gap: 5px; color: var(--txt-fnt); font: 8px/1 var(--f-term); }
  .agent i { width: 5px; height: 5px; background: var(--txt-fnt); }
  .agent i.working { background: var(--cue); animation: pulse 900ms steps(2) infinite; }
  .task em { color: var(--txt-dim); font: 7px/1 var(--f-umd); font-style: normal; text-transform: uppercase; }
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
  .usage > div { display: grid; grid-template-columns: minmax(58px, .8fr) 1fr auto; align-items: center; gap: 6px; padding: 5px 0; border-bottom: 1px solid var(--line); }
  .usage span, .usage small { display: block; color: var(--txt); font: 8px/1 var(--f-term); }
  .usage small { margin-top: 2px; color: var(--txt-fnt); font-size: 7px; }
  .usage i { height: 4px; background: var(--ink-200); }
  .usage em { display: block; height: 100%; background: var(--cue); }
  .usage b { color: var(--amber); font: 8px/1 var(--f-umd); }
  @keyframes pulse { 50% { opacity: .35; } }
  @media (prefers-reduced-motion: reduce) { .agent i.working { animation: none; } }
</style>
