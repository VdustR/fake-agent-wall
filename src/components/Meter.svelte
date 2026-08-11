<script lang="ts">
  interface Props {
    /** 0..1 */
    value: number
    /** 0..1 peak-hold cap. Omit for a plain ladder. */
    peak?: number
    segments?: number
    tone?: 'live' | 'amber' | 'cue' | 'coral'
  }
  const { value, peak, segments = 12, tone = 'live' }: Props = $props()

  const clamp = (n: number) => Math.max(0, Math.min(1, n))
  const lit = $derived(Math.round(clamp(value) * segments))
  // A real PPM holds its peak for a beat after the signal drops; the cap is how
  // you read a burst that has already passed.
  const cap = $derived(peak === undefined ? -1 : Math.min(segments - 1, Math.floor(clamp(peak) * segments)))
</script>

<div class="meter" style="--n:{segments}" data-tone={tone} aria-hidden="true">
  {#each { length: segments } as _, i}
    <i class:on={i < lit} class:hot={i >= segments - 2} class:cap={i === cap && i >= lit}></i>
  {/each}
</div>

<style>
  .meter {
    display: grid;
    grid-template-columns: repeat(var(--n), 1fr);
    gap: 1px;
    height: 100%;
    min-height: 5px;
    align-items: stretch;
  }
  .meter i {
    background: var(--led-off);
    transition: background 90ms linear;
  }
  .meter i.on {
    background: var(--live);
  }
  .meter[data-tone='amber'] i.on {
    background: var(--amber);
  }
  .meter[data-tone='cue'] i.on {
    background: var(--cue);
  }
  .meter[data-tone='coral'] i.on {
    background: var(--coral);
  }
  .meter i.on.hot {
    background: var(--led-hot);
  }
  .meter[data-tone='cue'] i.on.hot {
    background: var(--amber);
  }
  .meter i.cap {
    background: var(--amber);
  }
</style>
