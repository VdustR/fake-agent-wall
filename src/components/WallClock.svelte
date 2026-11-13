<script lang="ts">
  import { onMount } from 'svelte'
  import { formatLocalTime, observeWallClock } from '../lib/wall-clock'

  let timestamp = $state(Date.now())
  const label = $derived(formatLocalTime(timestamp))
  onMount(() => observeWallClock(value => { timestamp = value }))
</script>

<time class="wall-clock tnum" datetime={new Date(timestamp).toISOString()} title="Local system time">{label}</time>

<style>
  .wall-clock { display: inline-block; white-space: nowrap; min-width: 12ch; }
</style>
