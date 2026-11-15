<script lang="ts">
  import { listFlip, listMotion } from '../lib/list-motion.svelte'
  import type { Swarm } from '../lib/swarm.svelte'

  interface Props {
    swarm: Swarm
  }
  const { swarm }: Props = $props()

  const items = $derived(swarm.ticker.slice(0, 10))
</script>

<footer class="ticker" use:listMotion={() => swarm.reducedMotion}>
  <span class="tag umd-type">swarm log</span>
  <div class="crawl">
    <div class="cells">
      {#each items as it (it.id)}
        <span class="ev" animate:listFlip={{ disabled: swarm.reducedMotion }}>
          <em class="tnum">{it.slot}</em>
          <b class="tnum" title={it.clock} aria-label={`Event time ${it.clock}`}>{it.clock}</b>
          <span class="repo">{it.repo}</span>
          <span class="txt">{it.text}</span>
        </span>
      {/each}
    </div>
  </div>
</footer>

<style>
  .ticker {
    --cw: clamp(230px, 24vw, 400px);
    flex: 1;
    min-width: 0;
    display: flex;
    align-items: stretch;
    min-height: clamp(26px, 2.6vw, 42px);
    background: var(--ink-100);
    border: 1px solid var(--line-hi);
    border-radius: var(--r);
    overflow: hidden;
  }
  .tag {
    flex: none;
    display: grid;
    place-items: center;
    padding: 0 12px;
    background: var(--coral);
    color: var(--on-coral);
    font-weight: 700;
    letter-spacing: 0.16em;
  }
  .crawl {
    flex: 1;
    min-width: 0;
    overflow: hidden;
    /* The oldest entries dissolve into the right edge instead of clipping. */
    /* Opaque-to-transparent alpha stop, not a colour choice. */
    mask-image: linear-gradient(90deg, rgb(0 0 0 / 100%) 78%, rgb(0 0 0 / 0%) 99%);
  }
  .cells {
    display: grid;
    grid-auto-flow: column;
    grid-auto-columns: var(--cw);
    height: 100%;
    width: max-content;
  }

  .ev {
    background: var(--ink-100);
    display: flex;
    align-items: baseline;
    gap: 7px;
    padding: 0 13px;
    border-right: 1px solid var(--line);
    font-size: clamp(9px, 0.68vw, 13px);
    line-height: 1.2;
    align-self: center;
    white-space: nowrap;
    overflow: hidden;
  }
  .ev b {
    flex: none;
    color: var(--txt-fnt);
    font-weight: 400;
  }
  .ev em {
    flex: none;
    font-style: normal;
    /* A grey chip is plate, not lamp, so it takes plate ink rather than one of
       the on-* lamp inks. */
    color: var(--ink-000);
    background: var(--umd);
    padding: 2px 4px;
    font-weight: 700;
    font-size: 0.88em;
  }
  .repo {
    flex: none;
    color: var(--cue);
  }
  .txt {
    color: var(--txt);
    overflow: hidden;
    text-overflow: ellipsis;
  }
</style>
