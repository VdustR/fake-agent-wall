<script lang="ts">
  import { numberCells } from '../lib/rolling-number'
  interface Props { value: string | number; label?: string; duration?: number }
  const { value, label, duration = 360 }: Props = $props()
  const chars = $derived(numberCells(String(value)))
</script>

<span class="roller tnum" aria-label={label ?? String(value)} style={`--roll-duration: ${duration}ms`}>
  {#each chars as cell (cell.key)}
    {#if cell.digit !== undefined}
      <span class="digit" aria-hidden="true"><i style:transform={`translateY(calc(-${cell.digit} * 1.2em))`}>{#each Array(10) as _, n}<b>{n}</b>{/each}</i></span>
    {:else}<span aria-hidden="true">{cell.text}</span>{/if}
  {/each}
</span>

<style>
  .roller { display: inline-flex; align-items: center; font: inherit; line-height: 1.2; text-indent: 0; letter-spacing: normal; }
  .digit { display: inline-block; width: 1ch; height: 1.2em; overflow: hidden; }
  .digit i { display: flex; flex-direction: column; font-style: normal; transition: transform var(--roll-duration) cubic-bezier(.16, 1, .3, 1); }
  .digit b { flex: none; display: block; height: 1.2em; line-height: 1.2em; font: inherit; }
  @media (prefers-reduced-motion: reduce) { .digit i { transition: none; } }
</style>
