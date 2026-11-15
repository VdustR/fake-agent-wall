<script lang="ts">
  import RollingNumber from './RollingNumber.svelte'
  import { onMount } from 'svelte'
  import { formatLocalTime, observeWallClock } from '../lib/wall-clock'

  let timestamp = $state(Date.now())
  const label = $derived(formatLocalTime(timestamp))
  onMount(() => observeWallClock(value => { timestamp = value }))
</script>

<time class="wall-clock tnum" datetime={new Date(timestamp).toISOString()} title="Local system time" aria-label={label}><span aria-hidden="true"><RollingNumber value={label.slice(0, 8)} duration={180} /></span><span aria-hidden="true">{label.slice(8)}</span></time>

<style>
  .wall-clock { display: inline-flex; align-items: baseline; white-space: nowrap; min-width: 12ch; }
</style>
