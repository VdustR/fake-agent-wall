<script lang="ts">
  import { untrack } from 'svelte'
  import RollingNumber from './RollingNumber.svelte'
  import type { Swarm } from '../lib/swarm.svelte'
  import {
    normalizeThroughput,
    throughputFullScale,
    TOKENS_PER_SOURCE_FULL_SCALE,
    TOOLS_PER_SOURCE_FULL_SCALE,
  } from '../lib/telemetry-scale'

  interface Props {
    swarm: Swarm
  }
  const { swarm }: Props = $props()

  const tokenScale = $derived(throughputFullScale(swarm.agents.length, TOKENS_PER_SOURCE_FULL_SCALE))
  const toolScale = $derived(throughputFullScale(swarm.agents.length, TOOLS_PER_SOURCE_FULL_SCALE))

  const channels = $derived([
    {
      key: 'tok',
      label: 'tokens / min',
      scaleLabel: `Full scale: ${tokenScale.toLocaleString('en-US')} tokens/min`,
      value: normalizeThroughput(swarm.tokensPerMin, tokenScale),
      peak: normalizeThroughput(swarm.peakTokens, tokenScale),
      flat: false,
      read: `${(swarm.tokensPerMin / 1000).toFixed(1)}k`,
    },
    {
      key: 'tools',
      label: 'calls / min',
      scaleLabel: `Full scale: ${toolScale.toLocaleString('en-US')} calls/min`,
      value: normalizeThroughput(swarm.toolsPerMin, toolScale),
      peak: normalizeThroughput(swarm.peakTools, toolScale),
      flat: false,
      read: `${Math.round(swarm.toolsPerMin)}`,
    },
    {
      key: 'src',
      label: 'live / total',
      scaleLabel: 'Active sessions / total sessions',
      value: swarm.running / swarm.agents.length,
      peak: 0,
      // Every source working is the nominal state here, not an overload, so this
      // channel does not run into the red the way a throughput channel does.
      flat: true,
      read: `${swarm.running}/${swarm.agents.length}`,
    },
  ])
  // Bars stay continuous; four digit updates per second remain readable on camera.
  const readingFrame = $derived(Math.floor(swarm.uptimeMs / 250))
  let lastReadingFrame = -1
  let readings = $state<string[]>([])
  $effect(() => {
    const frame = readingFrame
    if (frame === lastReadingFrame) return
    lastReadingFrame = frame
    untrack(() => { readings = channels.map(({ read }) => read) })
  })

  // Keep the original normalized history; its 90 samples span about 12 seconds.
  const trace = $derived(swarm.history.map((value, index) =>
    `${index / Math.max(1, swarm.history.length - 1) * 100},${30 - value * 28}`,
  ).join(' '))
  const outputActivity = $derived(Math.round((swarm.history.at(-1) ?? 0) * 100))
</script>

<section class="tel" aria-label="Synthetic agent activity">
  <div class="bus">
    <header class="section-label umd-type"><b>agent activity</b><span>sim</span></header>
    <div class="channels">
      {#each channels as c, index (c.key)}
        <div class="ch" title={c.scaleLabel}>
          <div class="reading"><span class="lb umd-type">{c.label}</span><b class="tnum"><RollingNumber value={readings[index] ?? c.read} duration={180} /></b></div>
          <span class="ppm" aria-hidden="true">
            <i class="fill" class:flat={c.flat} style="--v:{c.value}"></i>
            {#if c.peak > 0.01}<i class="cap" style="--p:{c.peak}"></i>{/if}
          </span>
        </div>
      {/each}
    </div>
  </div>

  <div class="hist" title="Output activity · last approximately twelve seconds">
    <header class="section-label umd-type"><span>output activity</span><span><span class="activity-value"><RollingNumber value={outputActivity} duration={180} /></span>%</span></header>
    <svg class="trace" viewBox="0 0 100 32" preserveAspectRatio="none" role="img" aria-label="Normalized synthetic output activity over approximately twelve seconds">
      <line class="rule" x1="0" x2="100" y1="16" y2="16" />
      <polyline class="signal" points={trace} />
      <line class="now" x1="100" x2="100" y1="0" y2="32" />
    </svg>
  </div>
</section>

<style>
  .tel {
    flex: none;
    display: grid;
    grid-template-columns: minmax(0, max-content) clamp(90px, 12vw, 136px);
    width: fit-content;
    max-width: 100%;
    align-items: center;
    gap: 12px;
    padding: 4px 8px;
    background: var(--ink-100);
    border: 1px solid var(--line-hi);
    border-radius: var(--r);
  }
  .bus, .hist { min-width: 0; }
  .bus { display: flex; align-items: center; gap: 10px; }
  .bus > .section-label { flex: none; flex-direction: column; align-items: flex-start; gap: 2px; margin: 0; width: 10ch; }
  .hist { border-left: 1px solid var(--line); padding-left: 10px; }
  .hist > .section-label { flex-wrap: wrap; gap: 2px 6px; margin-bottom: 3px; letter-spacing: 0; }
  .section-label {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 8px;
    margin-bottom: 5px;
    color: var(--txt-dim);
    line-height: 1.2;
    white-space: nowrap;
  }
  .section-label b { color: var(--umd); white-space: normal; }
  .section-label > span:last-child:not(:first-child) { color: var(--txt-fnt); }
  .channels { flex: 0 1 auto; width: clamp(150px, 18vw, 260px); display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 10px; }
  .reading { display: flex; flex-direction: column; align-items: flex-start; gap: 2px; }
  .lb { color: var(--txt-dim); }
  .reading b { font: 700 clamp(10px, .86vw, 15px)/1.2 var(--f-umd); color: var(--readout-100); }
  .ppm { position: relative; display: block; height: 3px; margin-top: 3px; overflow: hidden; background: var(--ink-050); }
  .fill { position: absolute; inset: 0; background: linear-gradient(90deg, var(--cue) 0 62%, var(--amber) 62% 84%, var(--live) 84%); clip-path: inset(0 calc(100% - var(--v) * 100%) 0 0); }
  .fill.flat { background: var(--cue); }
  .cap { position: absolute; inset-block: 0; left: calc(var(--p) * 100% - 1px); width: 1px; background: var(--txt-hi); }
  .activity-value { display: inline-block; min-width: 3ch; text-align: right; }
  .trace { display: block; width: 100%; height: 18px; overflow: hidden; }
  .rule { stroke: var(--line); stroke-width: 1; vector-effect: non-scaling-stroke; }
  .signal { fill: none; stroke: var(--plot-primary); stroke-width: 1.2; stroke-linejoin: round; vector-effect: non-scaling-stroke; }
  .now { stroke: var(--txt-dim); stroke-width: 1; vector-effect: non-scaling-stroke; }
  @media (max-width: 540px) {
    .tel { gap: 8px; padding: 4px 6px; }
    .bus { gap: 8px; }
    .channels { gap: 8px; }
    .lb { white-space: normal; }
    .hist { padding-left: 8px; }
  }
</style>
