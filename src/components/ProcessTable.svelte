<script lang="ts">
  import { onMount, untrack } from 'svelte'
  import { flip } from 'svelte/animate'
  import { cubicOut } from 'svelte/easing'
  import { prefersReducedMotion } from 'svelte/motion'
  import { fade } from 'svelte/transition'
  import { HOST_SAMPLE_MS, type HostSnapshot } from '../lib/host-load'
  import RollingNumber from './RollingNumber.svelte'
  import { reconcileProcessOrder } from '../lib/process-order'

  const { snapshot }: { snapshot: HostSnapshot } = $props()
  let element = $state<HTMLDivElement>()
  let visibleRows = $state(4)
  let order = $state<number[]>([])
  let lastSort = -1
  let mounted = $state(false)
  function stopAnimations(target = element) {
    for (const animation of target?.getAnimations({ subtree: true }) ?? []) animation.cancel()
  }
  $effect(() => { if (prefersReducedMotion.current) stopAnimations() })
  $effect.pre(() => {
    const band = Math.floor(snapshot.sampledAtMs / 2000)
    const resort = band !== lastSort
    lastSort = band
    const processes = snapshot.processes
    untrack(() => { order = reconcileProcessOrder(order, processes, resort) })
  })
  const rows = $derived.by(() => {
    const processes = new Map(snapshot.processes.map(process => [process.pid, process]))
    return order.flatMap(id => processes.get(id) ? [processes.get(id)!] : []).slice(0, visibleRows)
  })
  const running = $derived(snapshot.processes.filter(p => p.state === 'R').length)
  const sleeping = $derived(snapshot.processes.filter(p => p.state === 'S').length)
  const waiting = $derived(snapshot.processes.filter(p => p.state === 'D').length)
  onMount(() => {
    mounted = true
    const observer = new ResizeObserver(() => {
      if (!element) return
      const summary = element.querySelector('.summary')?.getBoundingClientRect().height ?? 0
      const heading = element.querySelector('thead')?.getBoundingClientRect().height ?? 0
      const row = element.querySelector('tbody tr')?.getBoundingClientRect().height ?? 0
      if (row) visibleRows = Math.max(1, Math.min(32, Math.floor((element.clientHeight - summary - heading) / row)))
    })
    if (element) observer.observe(element)
    return () => observer.disconnect()
  })
</script>

<div class="processes" bind:this={element}>
  <div class="summary umd-type"><span><RollingNumber value={rows.length} />/<RollingNumber value={snapshot.processes.length} /> tasks · <RollingNumber value={running} /> R / <RollingNumber value={sleeping} /> S / <RollingNumber value={waiting} /> D</span><span>1 CPU = 100%</span></div>
  <table aria-label="Simulated processes sorted by CPU every two seconds">
    <colgroup><col class="pid" /><col class="source" /><col class="state" /><col class="cpu" /><col class="memory" /><col /></colgroup>
    <thead class="umd-type"><tr><th>PID</th><th>SRC</th><th>S</th><th class="sort">CPU%</th><th>RSS MiB</th><th>command</th></tr></thead>
    <tbody>
      {#each rows as process (process.pid)}
        <tr animate:flip={{ duration: prefersReducedMotion.current ? 0 : 320, easing: cubicOut }}
          in:fade={{ duration: !mounted || prefersReducedMotion.current ? 0 : 120 }} data-pid={process.pid} data-state={process.state} data-session={process.sessionSlot} data-tool-run={process.toolRunId} data-tool={process.toolCommand}
          title={process.sessionSlot === undefined ? process.command : process.sessionLabel + ' · ' + process.repo + (process.toolCommand ? ' · ' + process.toolCommand : '')}>
          <td>{process.pid}</td><td>{process.sessionSlot === undefined ? '—' : String(process.sessionSlot).padStart(2, '0')}</td><td>{process.state}</td>
          <td class="tnum"><RollingNumber value={process.cpu.toFixed(1)} duration={HOST_SAMPLE_MS} easing="linear" /></td>
          <td class="tnum"><RollingNumber value={Math.round(process.rssMiB)} duration={HOST_SAMPLE_MS} easing="linear" /></td>
          <td title={process.command}>{process.command}</td>
        </tr>
      {/each}
    </tbody>
  </table>
</div>

<style>
  .processes { flex: 1; min-height: 0; overflow: hidden; padding: 0 8px; }
  .summary { display: flex; align-items: baseline; justify-content: space-between; gap: 8px; padding: 6px 0; color: var(--txt-dim); white-space: nowrap; }
  .summary > span:last-child { color: var(--txt-fnt); }
  table { width: 100%; table-layout: fixed; border-collapse: collapse; font: 8px/1.25 var(--f-term); color: var(--txt); }
  col.pid { width: 8ch; } col.source { width: 4ch; } col.state { width: 2ch; } col.cpu { width: 7ch; } col.memory { width: 6ch; }
  th { padding: 3px 3px 4px 0; color: var(--txt-fnt); font-weight: 500; border-bottom: 1px solid var(--line-hi); text-align: right; }
  th.sort { color: var(--readout-050); }
  tbody tr { background: var(--ink-050); }
  td { height: 20px; padding: 3px 3px 3px 0; border-bottom: 1px solid var(--line); text-align: right; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  td:first-child, th:first-child, td:last-child, th:last-child { text-align: left; }
  td:last-child { padding-left: 7px; }
  td:nth-child(2) { color: var(--txt-dim); }
  td:nth-child(4) { color: var(--readout-050); }
  td:nth-child(3) { transition: color 160ms ease-out; }
  tr[data-state='R'] td:nth-child(3) { color: var(--cue); }
  tr[data-state='D'] td:nth-child(3) { color: var(--hold); }
  @media (prefers-reduced-motion: reduce) { td:nth-child(3) { transition: none; } }
</style>
