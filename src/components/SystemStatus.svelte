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
    { key: 'diskRead', secondary: 'diskWrite', label: 'disk i/o · MiB/s', read: `R ${Math.round(load.diskRead)} · W ${Math.round(load.diskWrite)}`, max: HOST_PROFILE.diskMiBs, scale: 'R/W · 0–800' },
    { key: 'netRx', secondary: 'netTx', label: 'network · Mb/s', read: `RX ${Math.round(load.netRx)} · TX ${Math.round(load.netTx)}`, max: HOST_PROFILE.networkMbps, scale: 'RX/TX · 0–1G' },
  ] satisfies Array<{ key: keyof HostLoad; secondary?: keyof HostLoad; label: string; read: string; min?: number; max: number; scale: string; stepped?: boolean }>)
</script>

<article class="system" aria-label="Simulated system status" style={`--host-sample-time:${HOST_SAMPLE_MS}ms`}>
  <header class="umd-type"><b>system</b><span>sim · {HOST_PROFILE.logicalCpus} vCPU</span></header>
  <div class="instruments">
    <div class="cpu-summary"><span class="umd-type">CPU avg</span><b class="tnum"><RollingNumber value={`${Math.round(load.cpu)}%`} duration={180} /></b><small class="umd-type">32s history</small></div>
    <div class="cores" aria-label="Logical CPU utilization">
      {#each snapshot.cores as value, core (core)}
        <div class="core" class:hot={value >= 85} title={`CPU ${core}: ${value.toFixed(1)}%`}>
          <span>{String(core).padStart(2, '0')}</span><b class="tnum"><RollingNumber value={Math.round(value)} duration={180} /></b>
          <i aria-hidden="true"><em style:transform={`scaleX(${value / 100})`}></em></i>
        </div>
      {/each}
    </div>
    <div class="cpu-history"><HostHistory history={swarm.hostHistory} primary="cpu" max={100} scale="0–100% · all CPUs" /></div>
    <div class="metrics">
      {#each metrics as metric (metric.key)}
        <div class="metric" data-metric={metric.key}>
          <div class="reading"><span class="umd-type">{metric.label}</span><b class="tnum"><RollingNumber value={metric.read} duration={180} /></b></div>
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
  .instruments { flex: 1; min-height: 0; display: flex; flex-direction: column; gap: 6px; padding: 7px 8px; }
  .cpu-summary { flex: none; display: flex; align-items: baseline; gap: 8px; color: var(--txt-dim); }
  .cpu-summary b { color: var(--amber); font: 700 clamp(10px, .86vw, 15px)/1.2 var(--f-umd); }
  .cpu-summary small { margin-left: auto; color: var(--txt-fnt); }
  .cores { flex: none; display: grid; grid-template-columns: repeat(8, minmax(0, 1fr)); gap: 4px 7px; }
  .core { min-width: 0; display: grid; grid-template-columns: auto 1fr; gap: 2px; font: 7px/1 var(--f-umd); }
  .core span { color: var(--txt-fnt); }
  .core b { justify-self: end; color: var(--txt); font-weight: 500; }
  .core i { grid-column: 1 / -1; display: block; height: 3px; overflow: hidden; background: var(--ink-050); }
  .core em { display: block; height: 100%; background: var(--cue); transform-origin: left; transition: transform var(--host-sample-time) linear; }
  .core.hot em { background: var(--hold); }
  .cpu-history { flex: none; }
  .metrics { flex: 1; min-height: 0; display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); grid-template-rows: repeat(2, minmax(0, 1fr)); gap: 8px 12px; }
  .metric { min-width: 0; min-height: 0; display: flex; flex-direction: column; gap: 3px; }
  .reading { display: flex; flex-wrap: wrap; align-items: baseline; gap: 2px 6px; justify-content: space-between; color: var(--txt-dim); }
  .reading b { color: var(--txt); font: 500 clamp(9px, .72vw, 12px)/1.2 var(--f-umd); white-space: nowrap; }
  .plot { flex: 1; min-height: 22px; }
  .plot :global(.host-history) { height: 100%; display: flex; flex-direction: column; }
  .plot :global(svg) { flex: 1; height: auto; min-height: 16px; }
  @container system (max-height: 240px) { .cpu-history { display: none; } .instruments { gap: 4px; padding-block: 5px; } }
  @media (prefers-reduced-motion: reduce) { .core em { transition: none; } }
</style>
