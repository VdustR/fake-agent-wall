<script lang="ts">
  import type { Agent } from '../lib/agent.svelte'
  import Meter from './Meter.svelte'
  import Terminal from './Terminal.svelte'

  interface Props {
    agent: Agent
    beat: number
    onAir: boolean
    cued: boolean
    calm?: boolean
  }
  const { agent, beat, onAir, cued, calm = false }: Props = $props()

  // Broadcast tally semantics: red is the program bus (this source is working),
  // green belongs to preview alone, amber is a source blocked on an operator.
  const WORD: Record<string, string> = {
    run: 'live',
    cue: 'think',
    hold: 'hold',
    done: 'idle',
  }
</script>

<article class="tile" data-tally={onAir ? 'air' : agent.status} class:cued>
  <div class="feed">
    <Terminal {agent} {beat} {calm} />
    {#if onAir}<span class="air umd-type">pgm</span>{/if}
    {#if cued}<span class="pvw umd-type">preview</span>{/if}
  </div>

  <!-- UMD: the label strip a multiviewer silkscreens under every source. -->
  <footer class="umd umd-type">
    <span class="src tnum">{agent.numLabel}</span>
    <span class="name">{agent.label}</span>
    <span class="repo">{agent.repo}<i>▸</i>{agent.branch}</span>
    <span class="mtr"><Meter
        value={agent.level}
        peak={agent.levelPeak}
        segments={9}
        tone={agent.status === 'hold' ? 'amber' : 'live'}
      /></span>
    <span class="state">{onAir ? 'on air' : WORD[agent.status]}</span>
  </footer>
</article>

<style>
  .tile {
    position: relative;
    display: flex;
    flex-direction: column;
    min-height: 0;
    background: var(--ink-000);
    border: 1.5px solid var(--line-hi);
    border-radius: var(--r);
    overflow: hidden;
    transition:
      border-color 120ms linear,
      box-shadow 160ms linear;
  }
  .tile[data-tally='air'] {
    border-color: var(--live);
    box-shadow:
      0 0 0 1px color-mix(in oklab, var(--live) 45%, transparent),
      0 0 22px color-mix(in oklab, var(--live) 26%, transparent);
  }
  .tile[data-tally='run'] {
    border-color: color-mix(in oklab, var(--live) 72%, var(--ink-200));
    box-shadow: inset 0 0 22px color-mix(in oklab, var(--live) 8%, transparent);
  }
  .tile[data-tally='hold'] {
    border-color: var(--hold);
    box-shadow: 0 0 16px color-mix(in oklab, var(--hold) 20%, transparent);
  }
  .tile[data-tally='cue'] {
    border-color: color-mix(in oklab, var(--live) 40%, var(--ink-200));
  }
  .tile[data-tally='done'] {
    border-color: color-mix(in oklab, var(--done) 40%, var(--ink-200));
  }
  .tile.cued {
    border-color: var(--cue);
    box-shadow:
      0 0 0 1px color-mix(in oklab, var(--cue) 55%, transparent),
      0 0 20px color-mix(in oklab, var(--cue) 28%, transparent);
    animation: cuepulse 300ms steps(1) infinite;
  }
  @keyframes cuepulse {
    0%,
    49% {
      border-color: var(--cue);
    }
    50%,
    100% {
      border-color: color-mix(in oklab, var(--cue) 40%, var(--ink-200));
    }
  }

  .feed {
    position: relative;
    flex: 1;
    min-height: 0;
  }

  .air,
  .pvw {
    position: absolute;
    top: 0;
    right: 0;
    padding: 3px 5px 3px 6px;
    font-weight: 700;
    letter-spacing: 0.14em;
    color: var(--on-live);
  }
  .air {
    background: var(--live);
  }
  .pvw {
    background: var(--cue);
    color: var(--on-cue);
  }

  .umd {
    flex: none;
    display: grid;
    grid-template-columns: auto minmax(0, auto) minmax(0, 1fr) 42px auto;
    align-items: center;
    gap: 7px;
    height: clamp(16px, 1.5vw, 22px);
    padding-right: 6px;
    background: var(--ink-150);
    border-top: 1px solid var(--line);
    color: var(--umd);
  }
  .src {
    align-self: stretch;
    display: grid;
    place-items: center;
    padding: 0 6px;
    background: var(--ink-200);
    color: var(--txt-hi);
    font-weight: 700;
    letter-spacing: 0.04em;
  }
  .name {
    color: var(--txt-hi);
    font-weight: 700;
    white-space: nowrap;
  }
  .repo {
    color: var(--txt-dim);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .repo i {
    color: var(--txt-fnt);
    padding: 0 4px;
    font-style: normal;
  }

  @media (max-width: 720px) {
    /* Below this the repo/branch pair truncates to noise; the source number,
       name, level and tally are the labels that still do work. */
    .umd {
      grid-template-columns: auto minmax(0, 1fr) 30px auto;
    }
    .repo {
      display: none;
    }
  }
  .mtr {
    height: 7px;
  }
  .state {
    color: var(--umd);
    font-weight: 700;
    letter-spacing: 0.12em;
  }
  .tile[data-tally='air'] .state,
  .tile[data-tally='run'] .state {
    color: var(--live);
  }
  .tile[data-tally='cue'] .state {
    color: color-mix(in oklab, var(--live) 66%, var(--umd));
  }
  .tile[data-tally='hold'] .state {
    color: var(--hold);
  }
  .tile[data-tally='done'] .state {
    color: var(--done);
  }
</style>
