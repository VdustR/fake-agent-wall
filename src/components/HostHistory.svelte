<script lang="ts">
  import type { HostLoad } from '../lib/host-load'
  import { HOST_SAMPLE_MS } from '../lib/host-load'

  interface Props {
    history: readonly HostLoad[]
    primary: keyof HostLoad
    secondary?: keyof HostLoad
    min?: number
    max: number
    stepped?: boolean
    scale: string
  }
  const { history, primary, secondary, min = 0, max, stepped = false, scale }: Props = $props()
  function path(key: keyof HostLoad): string {
    return history.map((sample, index) => {
      const x = index / Math.max(1, history.length - 1) * 100
      const y = 22 - Math.max(0, Math.min(1, (sample[key] - min) / (max - min))) * 20
      return index === 0 ? `M${x},${y}` : stepped ? `H${x}V${y}` : `L${x},${y}`
    }).join(' ')
  }
</script>

<div class="host-history" title="Fixed scale · last 32 seconds">
  <svg viewBox="0 0 100 24" preserveAspectRatio="none" aria-hidden="true">
    <path class="reference" d="M0,2H100 M0,12H100 M0,22H100" />
    {#key history}
      <g class="moving" style={`--sample-step:${100 / Math.max(1, history.length - 1)}%;--sample-time:${HOST_SAMPLE_MS}ms`}>
        <path class="primary" d={path(primary)} />
        {#if secondary}<path class="secondary" d={path(secondary)} />{/if}
      </g>
    {/key}
  </svg>
  <span class="scale umd-type">{scale}</span>
</div>

<style>
  .host-history { min-width: 0; }
  svg { display: block; width: 100%; height: 22px; overflow: hidden; }
  path { fill: none; stroke-width: 1; vector-effect: non-scaling-stroke; }
  .reference { stroke: var(--line); stroke-width: .5; }
  .primary { stroke: var(--plot-primary); }
  .secondary { stroke: var(--plot-secondary); }
  .moving { transform-box: view-box; animation: advance var(--sample-time) linear; }
  @keyframes advance { from { transform: translateX(var(--sample-step)); } to { transform: translateX(0); } }
  .scale { display: block; color: var(--txt-fnt); text-align: right; white-space: nowrap; font-size: 6px; line-height: 1; letter-spacing: 0; }
  @media (max-width: 540px) { svg { height: 18px; } }
  @media (prefers-reduced-motion: reduce) { .moving { animation: none; } }
</style>
