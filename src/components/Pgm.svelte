<script lang="ts">
  import type { Agent } from '../lib/agent.svelte'
  import Meter from './Meter.svelte'
  import Terminal from './Terminal.svelte'

  interface Props {
    agent: Agent
    beat: number
    flash: number
    calm?: boolean
    /** Milliseconds until the next program cut; 0 when cutting is disabled. */
    nextCutIn?: number
    /** Source number queued on the preview bus, or null. */
    cueing?: string | null
  }
  const { agent, beat, flash, calm = false, nextCutIn = 0, cueing = null }: Props = $props()

  const mmss = $derived.by(() => {
    const s = Math.floor(agent.sessionMs / 1000)
    return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`
  })
</script>

<section class="pgm" style="--flash:{Math.min(1, flash / 190)}">
  <header class="head umd-type">
    <span class="tag">pgm</span>
    <span class="src tnum">src {agent.numLabel}</span>
    <span class="who">{agent.label}</span>
    <span class="task">{agent.task}</span>
    <span class="provider">{agent.provider}</span>
    <span class="model">{agent.model}</span>
    {#if cueing}
      <span class="next cueing">cue src {cueing}</span>
    {:else if nextCutIn > 0}
      <span class="next tnum">next cut {(nextCutIn / 1000).toFixed(1)}</span>
    {/if}
  </header>

  <div class="screen">
    <Terminal {agent} {beat} {calm} pgm />
    <!-- Title-safe brackets, the way a program monitor marks its action area. -->
    <span class="safe" aria-hidden="true"></span>
    {#if flash > 0}
      <span class="cut" aria-hidden="true"></span>
    {/if}
  </div>

  <footer class="umd umd-type">
    <span class="k">repo</span><span class="v">{agent.repo}</span>
    <span class="k">branch</span><span class="v br">{agent.branch}</span>
    <span class="k">t+</span><span class="v tnum">{mmss}</span>
    <span class="k">tools</span><span class="v tnum">{agent.toolUses}</span>
    <span class="k">↑</span><span class="v tnum">{(agent.tokensUp / 1000).toFixed(1)}k</span>
    <span class="k">↓</span><span class="v tnum">{(agent.tokensDown / 1000).toFixed(1)}k</span>
    <span class="lvl"><Meter value={agent.level} peak={agent.levelPeak} segments={16} /></span>
  </footer>
</section>

<style>
  .pgm {
    display: flex;
    flex-direction: column;
    min-height: 0;
    background: var(--ink-000);
    border: 2px solid var(--live);
    border-radius: var(--r);
    box-shadow:
      0 0 0 1px color-mix(in oklab, var(--live) 30%, transparent),
      0 0 40px color-mix(in oklab, var(--live) 16%, transparent);
    overflow: hidden;
  }

  .head {
    flex: none;
    display: flex;
    align-items: center;
    gap: 10px;
    height: clamp(20px, 1.9vw, 30px);
    padding-right: 10px;
    background: var(--ink-150);
    border-bottom: 1px solid var(--line-hi);
    white-space: nowrap;
    overflow: hidden;
  }
  .tag {
    align-self: stretch;
    display: grid;
    place-items: center;
    padding: 0 10px;
    background: var(--live);
    color: var(--on-live);
    font-weight: 700;
    letter-spacing: 0.18em;
  }
  .src {
    color: var(--umd);
    font-weight: 700;
  }
  .who {
    color: var(--txt-hi);
    font-weight: 700;
  }
  .task {
    color: var(--txt-dim);
    text-transform: none;
    letter-spacing: 0.04em;
    overflow: hidden;
    text-overflow: ellipsis;
    flex: 1;
  }
  .model {
    color: var(--coral);
    font-weight: 700;
  }
  .provider {
    color: var(--txt-fnt);
    font-weight: 500;
  }
  /* The cue lead is 900ms of green; without a number beside it the signature
     interaction reads once and then reads as decoration. */
  .next {
    align-self: stretch;
    display: grid;
    place-items: center;
    padding: 0 8px;
    margin-left: 2px;
    background: var(--ink-200);
    color: var(--umd);
    font-weight: 700;
  }
  .next.cueing {
    background: var(--cue);
    color: var(--on-cue);
  }

  /* The one recess on the wall: a program monitor sits below its rack plate. */
  .screen {
    position: relative;
    flex: 1;
    min-height: 0;
    box-shadow:
      inset 0 0 0 1px rgb(0 0 0 / 100%),
      inset 0 3px 9px rgba(0, 0, 0, 0.75);
  }

  .safe {
    position: absolute;
    inset: clamp(6px, 0.8vw, 14px);
    pointer-events: none;
    background:
      linear-gradient(var(--line-hi), var(--line-hi)) 0 0 / 12px 1px no-repeat,
      linear-gradient(var(--line-hi), var(--line-hi)) 0 0 / 1px 12px no-repeat,
      linear-gradient(var(--line-hi), var(--line-hi)) 100% 0 / 12px 1px no-repeat,
      linear-gradient(var(--line-hi), var(--line-hi)) 100% 0 / 1px 12px no-repeat,
      linear-gradient(var(--line-hi), var(--line-hi)) 0 100% / 12px 1px no-repeat,
      linear-gradient(var(--line-hi), var(--line-hi)) 0 100% / 1px 12px no-repeat,
      linear-gradient(var(--line-hi), var(--line-hi)) 100% 100% / 12px 1px no-repeat,
      linear-gradient(var(--line-hi), var(--line-hi)) 100% 100% / 1px 12px no-repeat;
    opacity: 0.55;
  }

  /* The cut: a hard vision-mixer flash, not a fade. */
  .cut {
    position: absolute;
    inset: 0;
    pointer-events: none;
    background: linear-gradient(
      180deg,
      rgba(255, 255, 255, 0.9) 0%,
      rgba(255, 120, 90, 0.35) 46%,
      transparent 47%,
      transparent 53%,
      rgba(255, 120, 90, 0.35) 54%,
      rgba(255, 255, 255, 0.9) 100%
    );
    opacity: calc(var(--flash) * 0.5);
    mix-blend-mode: screen;
  }

  .umd {
    flex: none;
    display: flex;
    align-items: center;
    gap: 6px;
    height: clamp(19px, 1.8vw, 28px);
    padding: 0 10px;
    background: var(--ink-150);
    border-top: 1px solid var(--line-hi);
    white-space: nowrap;
    overflow: hidden;
  }
  .k {
    flex: none;
    color: var(--txt-fnt);
  }
  .v {
    flex: none;
    min-width: 0;
    max-width: 22ch;
    overflow: hidden;
    text-overflow: ellipsis;
    color: var(--txt-hi);
    font-weight: 700;
    padding-right: 8px;
  }
  .v.br {
    color: var(--cue);
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .lvl {
    flex: none;
    margin-left: auto;
    width: clamp(70px, 9vw, 150px);
    height: 8px;
  }

  @media (max-width: 900px) {
    /* Keep the repo/branch pair; drop the counters that will not fit. */
    .umd .k:nth-of-type(n + 5),
    .umd .v:nth-of-type(n + 5) {
      display: none;
    }
    .task {
      display: none;
    }
  }
</style>
