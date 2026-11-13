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
    --lamp: var(--live);
    position: relative;
    background: var(--led-off);
  }
  .meter[data-tone='amber'] i { --lamp: var(--amber); }
  .meter[data-tone='cue'] i { --lamp: var(--cue); }
  .meter[data-tone='coral'] i { --lamp: var(--coral); }
  .meter i.hot { --lamp: var(--led-hot); }
  .meter[data-tone='cue'] i.hot { --lamp: var(--amber); }
  .meter i::after {
    content: '';
    position: absolute;
    inset: 0;
    background: var(--lamp);
    opacity: 0;
    transition: opacity 650ms cubic-bezier(.2, .7, .2, 1), background-color 180ms linear;
  }
  .meter i.on::after,
  .meter i.cap::after {
    opacity: 1;
    transition-duration: 40ms, 180ms;
  }
  .meter i.cap::after { background: var(--amber); }
  @media (prefers-reduced-motion: reduce) {
    .meter i::after { transition: none; }
  }
</style>
