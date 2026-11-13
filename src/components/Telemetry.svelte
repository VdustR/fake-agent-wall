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
      value: normalizeThroughput(swarm.tokensPerMin, tokenScale),
      peak: normalizeThroughput(swarm.peakTokens, tokenScale),
      flat: false,
      read: `${(swarm.tokensPerMin / 1000).toFixed(1)}k`,
      load: `${Math.round(normalizeThroughput(swarm.tokensPerMin, tokenScale) * 100)}% fs`,
    },
    {
      key: 'tools',
      label: 'calls / min',
      value: normalizeThroughput(swarm.toolsPerMin, toolScale),
      peak: normalizeThroughput(swarm.peakTools, toolScale),
      flat: false,
      read: `${Math.round(swarm.toolsPerMin)}`,
      load: `${Math.round(normalizeThroughput(swarm.toolsPerMin, toolScale) * 100)}% fs`,
    },
    {
      key: 'src',
      label: 'live / total',
      value: swarm.running / swarm.agents.length,
      peak: 0,
      // Every source working is the nominal state here, not an overload, so this
      // channel does not run into the red the way a throughput channel does.
      flat: true,
      read: `${swarm.running}/${swarm.agents.length}`,
      load: `${Math.round(swarm.running / swarm.agents.length * 100)}% live`,
    },
  ])
  // Bars stay continuous; four digit updates per second remain readable on camera.
  const readingFrame = $derived(Math.floor(swarm.uptimeMs / 250))
  let lastReadingFrame = -1
  let readings = $state<{ read: string; load: string }[]>([])
  $effect(() => {
    const frame = readingFrame
    if (frame === lastReadingFrame) return
    lastReadingFrame = frame
    untrack(() => { readings = channels.map(({ read, load }) => ({ read, load })) })
  })

  // Keep the original normalized history; its 90 samples span about 12 seconds.
  const trace = $derived(swarm.history.map((value, index) =>
    `${index / Math.max(1, swarm.history.length - 1) * 100},${30 - value * 28}`,
  ).join(' '))
  const pressure = $derived(Math.round((swarm.history.at(-1) ?? 0) * 100))
  const contextAgents = $derived(swarm.agents.slice(0, 27))
</script>

<section class="tel" aria-label="Synthetic swarm telemetry">
  <div class="bus">
    <header class="section-label umd-type"><b>swarm bus</b><span>sim</span></header>
    <div class="channels">
      {#each channels as c, index (c.key)}
        <div class="ch">
          <div class="reading"><span class="lb umd-type">{c.label}</span><b class="tnum"><RollingNumber value={readings[index]?.read ?? c.read} duration={180} /></b></div>
          <span class="ppm" aria-hidden="true">
            <i class="fill" class:flat={c.flat} style="--v:{c.value}"></i>
            {#if c.peak > 0.01}<i class="cap" style="--p:{c.peak}"></i>{/if}
          </span>
          <small class="load umd-type"><RollingNumber value={readings[index]?.load ?? c.load} duration={180} /></small>
        </div>
      {/each}
    </div>
  </div>

  <div class="hist">
    <header class="section-label umd-type"><span>output pressure</span><span><RollingNumber value={pressure} duration={180} />% · ~12s</span></header>
    <svg class="trace" viewBox="0 0 100 32" preserveAspectRatio="none" role="img" aria-label="Normalized synthetic output pressure over approximately twelve seconds">
      {#each [25, 50, 75] as tick}
        <line class="rule" x1="0" x2="100" y1={30 - tick * .28} y2={30 - tick * .28} />
      {/each}
      <polygon class="area" points={`0,32 ${trace} 100,32`} />
      <polyline class="signal" points={trace} />
      <line class="now" x1="100" x2="100" y1="0" y2="32" />
    </svg>
  </div>

  <div class="bridge">
    <header class="section-label umd-type"><span>context remaining</span>{#if swarm.agents.length > 27}<span>01–27 / {swarm.agents.length}</span>{/if}</header>
    <div class="contexts">
      {#each contextAgents as a (a.slot)}
        <div class="context" class:low={a.contextLeft < 25} aria-label={`Session ${a.numLabel}: ${Math.round(a.contextLeft)}% context remaining`}>
          <span class="id">{a.numLabel}</span><b class="tnum"><RollingNumber value={Math.round(a.contextLeft)} /></b>
          <span class="track" aria-hidden="true"><i style="--v:{a.contextLeft / 100}"></i></span>
        </div>
      {/each}
    </div>
  </div>
</section>

<style>
  .tel {
    flex: none;
    display: grid;
    grid-template-columns: minmax(220px, 1fr) minmax(140px, 1fr) clamp(240px, 25vw, 360px);
    gap: 16px;
    margin: 0 calc(var(--gap) * 1.5) calc(var(--gap) / 2);
    padding: 6px 10px;
    background: var(--ink-100);
    border: 1px solid var(--line-hi);
    border-radius: var(--r);
  }
  .bus, .hist, .bridge { min-width: 0; }
  .hist, .bridge { border-left: 1px solid var(--line); padding-left: 16px; }
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
  .section-label b { color: var(--umd); }
  .section-label > span:last-child:not(:first-child) { color: var(--txt-fnt); }
  .channels { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px; }
  .reading { display: flex; align-items: baseline; justify-content: space-between; gap: 4px; }
  .lb { color: var(--txt-dim); white-space: nowrap; }
  .reading b { font: 700 clamp(10px, .86vw, 15px)/1.2 var(--f-umd); color: var(--amber); }
  .ppm { position: relative; display: block; height: 4px; margin-top: 3px; overflow: hidden; background: var(--ink-050); }
  .fill { position: absolute; inset: 0; background: linear-gradient(90deg, var(--cue) 0 62%, var(--amber) 62% 84%, var(--live) 84%); clip-path: inset(0 calc(100% - var(--v) * 100%) 0 0); }
  .fill.flat { background: var(--cue); }
  .cap { position: absolute; inset-block: 0; left: calc(var(--p) * 100% - 1px); width: 1px; background: var(--txt-hi); }
  .load { display: block; margin-top: 3px; color: var(--txt-fnt); }
  .trace { display: block; width: 100%; height: 34px; overflow: hidden; }
  .rule { stroke: var(--line); stroke-width: 1; vector-effect: non-scaling-stroke; }
  .area { fill: color-mix(in oklab, var(--cue) 12%, transparent); }
  .signal { fill: none; stroke: var(--cue); stroke-width: 1.2; stroke-linejoin: round; vector-effect: non-scaling-stroke; }
  .now { stroke: var(--txt-dim); stroke-width: 1; vector-effect: non-scaling-stroke; }
  .contexts { display: grid; grid-template-columns: repeat(9, minmax(0, 1fr)); gap: 4px 8px; }
  .context { position: relative; display: flex; align-items: baseline; justify-content: space-between; gap: 2px; padding-bottom: 3px; font: clamp(7px, .54vw, 10px)/1 var(--f-umd); }
  .id { color: var(--txt-fnt); }
  .context b { color: var(--txt); font-weight: 500; }
  .track { position: absolute; inset: auto 0 0; height: 2px; background: var(--ink-050); overflow: hidden; }
  .track i { display: block; height: 100%; background: var(--cue); transform: scaleX(var(--v)); transform-origin: left; transition: transform 300ms linear; }
  .context.low b { color: var(--hold); }
  .context.low .track i { background: var(--hold); }
  @media (max-width: 900px) {
    .tel { grid-template-columns: minmax(0, 1fr) minmax(0, .8fr); gap: 8px 12px; }
    .bridge { grid-column: 1 / -1; border-left: 0; border-top: 1px solid var(--line); padding: 5px 0 0; display: grid; grid-template-columns: 80px minmax(0, 1fr); gap: 12px; align-items: start; }
    .bridge .section-label { display: block; white-space: normal; }
    .bridge .section-label > span { display: block; }
    .contexts { grid-template-columns: repeat(13, minmax(0, 1fr)); gap: 4px 6px; }
    .hist { padding-left: 12px; }
  }
  @media (max-width: 540px) {
    .tel { padding: 6px 8px; gap: 7px 10px; }
    .channels { gap: 8px; }
    .reading { flex-direction: column; gap: 2px; }
    .hist { padding-left: 10px; }
    .trace { height: 42px; }
    .bridge { grid-template-columns: 48px minmax(0, 1fr); gap: 8px; }
    .contexts { grid-template-columns: repeat(9, minmax(0, 1fr)); gap: 4px 6px; }

  }
  @media (prefers-reduced-motion: reduce) { .track i { transition: none; } }
</style>
