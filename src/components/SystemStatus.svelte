<script lang="ts">
  import type { Swarm } from '../lib/swarm.svelte'
  import { HOST_PROFILE, HOST_SAMPLE_MS, type HostLoad } from '../lib/host-load'
  import HostHistory from './HostHistory.svelte'
  import RollingNumber from './RollingNumber.svelte'

  const { swarm }: { swarm: Swarm } = $props()
  const snapshot = $derived(swarm.host)
  const load = $derived(snapshot.load)
  const metrics = $derived([
    { key: 'memoryGiB', label: 'memory', read: `${load.memoryGiB.toFixed(1)} / ${HOST_PROFILE.memoryGiB} GiB`, max: HOST_PROFILE.memoryGiB, scale: '0–64GiB', stepped: true },
    { key: 'storageGiB', label: 'storage', read: `${(load.storageGiB / 1024).toFixed(2)} / ${HOST_PROFILE.storageGiB / 1024} TiB`, min: 1152, max: 1280, scale: '1.125–1.25TiB', stepped: true },
    { key: 'diskRead', secondary: 'diskWrite', label: 'disk i/o', unit: 'MiB/s', read: `R${Math.round(load.diskRead)} W${Math.round(load.diskWrite)}`, max: HOST_PROFILE.diskMiBs, scale: 'R/W · 0–800' },
    { key: 'netRx', secondary: 'netTx', label: 'network', unit: 'Mb/s', read: `RX${Math.round(load.netRx)} TX${Math.round(load.netTx)}`, max: HOST_PROFILE.networkMbps, scale: 'RX/TX · 0–1G' },
  ] satisfies Array<{ key: keyof HostLoad; secondary?: keyof HostLoad; label: string; unit?: string; read: string; min?: number; max: number; scale: string; stepped?: boolean }>)
</script>

<article class="system" aria-label="Simulated system status" style={`--host-sample-time:${HOST_SAMPLE_MS}ms`}>
  <header class="umd-type"><b>system</b><span>sim · {HOST_PROFILE.logicalCpus} vCPU</span></header>
  <div class="instruments">
    <div class="cpu-summary"><span class="umd-type">CPU avg</span><b class="tnum"><RollingNumber value={`${Math.round(load.cpu)}%`} duration={180} /></b><div class="cpu-history"><HostHistory history={swarm.hostHistory} primary="cpu" max={100} scale="0–100% · all CPUs" /></div><small class="umd-type">32s history</small></div>
    <div class="cores" aria-label="Logical CPU utilization">
      {#each snapshot.cores as value, core (core)}
        <div class="core" class:hot={value >= 85} title={`CPU ${core}: ${value.toFixed(1)}%`}>
          <span>{String(core).padStart(2, '0')}</span><b class="tnum"><RollingNumber value={Math.round(value)} duration={180} /></b>
          <i aria-hidden="true"><em style:transform={`scaleY(${value / 100})`}></em></i>
        </div>
      {/each}
    </div>
    <div class="metrics">
      {#each metrics as metric (metric.key)}
        <div class="metric" data-metric={metric.key}>
          <div class="metric-label umd-type"><span>{metric.label}</span>{#if metric.unit}<small>{metric.unit}</small>{/if}</div>
          <b class="reading tnum"><RollingNumber value={metric.read} duration={180} /></b>
          <div class="plot"><HostHistory history={swarm.hostHistory} primary={metric.key} secondary={metric.secondary} min={metric.min} max={metric.max} scale={metric.scale} stepped={metric.stepped} /></div>
        </div>
      {/each}
    </div>
  </div>
</article>

<style>
  .system { container: system / size; display: flex; flex-direction: column; min-height: 0; overflow: hidden; background: var(--ink-100); border: 1px solid var(--line-hi); border-radius: var(--r); }
  header { flex: none; display: flex; align-items: center; justify-content: space-between; gap: 8px; height: clamp(19px, 1.65vw, 25px); padding: 0 8px; background: var(--ink-150); border-bottom: 1px solid var(--line); color: var(--txt-dim); }
  header b { color: var(--umd); }
  .instruments { flex: none; min-height: 0; display: flex; flex-direction: column; gap: 4px; padding: 5px 8px; }
  .cpu-summary { flex: none; display: flex; align-items: center; gap: 6px; color: var(--txt-dim); }
  .cpu-summary b { color: var(--readout-100); font: 700 clamp(10px, .86vw, 15px)/1.2 var(--f-umd); }
  .cpu-summary small { flex: none; color: var(--txt-fnt); }
  .cpu-history { flex: 0 1 96px; min-width: 40px; margin-left: auto; }
  .cpu-history :global(svg) { height: 14px; }
  .cpu-history :global(.scale) { display: none; }
  .cores { flex: none; display: grid; grid-template-columns: repeat(16, minmax(0, 1fr)); gap: 2px; }
  .core { min-width: 0; display: grid; justify-items: center; gap: 2px; font: 7px/1 var(--f-umd); }
  .core span { color: var(--txt-fnt); }
  .core b { grid-row: 3; color: var(--txt); font-weight: 500; min-width: 3ch; text-align: center; }
  .core i { grid-row: 2; display: block; width: 4px; height: 18px; overflow: hidden; background: var(--ink-050); }
  .core em { display: block; height: 100%; background: var(--cue); transform-origin: bottom; transition: transform var(--host-sample-time) linear; }
  .core.hot em { background: var(--hold); }
  .metrics { flex: none; min-height: 0; display: grid; gap: 2px; }
  .metric { min-width: 0; min-height: 20px; display: grid; grid-template-columns: 56px minmax(0, 1fr) 64px; align-items: center; gap: 6px; }
  .metric-label { display: flex; flex-direction: column; gap: 1px; color: var(--txt-dim); }
  .metric-label small { color: var(--txt-fnt); font: 6.5px/1.1 var(--f-umd); letter-spacing: 0; text-transform: none; }
  .reading { justify-self: end; color: var(--txt); font: 500 clamp(9px, .72vw, 12px)/1.2 var(--f-umd); white-space: nowrap; }
  .plot { min-width: 0; }
  .plot :global(svg) { height: 18px; }
  .plot :global(.scale) { display: none; }
  @media (prefers-reduced-motion: reduce) { .core em { transition: none; } }
</style>
