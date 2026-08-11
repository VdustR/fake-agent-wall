<script lang="ts">
  import type { Swarm } from '../lib/swarm.svelte'

  interface Props {
    swarm: Swarm
  }
  const { swarm }: Props = $props()

  const items = $derived(swarm.ticker.slice(0, 10))
  const head = $derived(items[0]?.id ?? 0)
</script>

<footer class="ticker">
  <span class="tag umd-type">swarm log</span>
  <div class="crawl">
    <!--
      Fixed-width cells plus a one-cell step on every arrival. The row advances
      like a real crawl instead of reflowing, which is what a variable-width
      list does when nine sources all report at once.
    -->
    {#key head}
      <div class="cells" class:still={swarm.reducedMotion}>
        {#each items as it (it.id)}
          <span class="ev">
            <em class="tnum">{it.slot}</em>
            <b class="tnum">{it.clock.slice(-2)}s</b>
            <span class="repo">{it.repo}</span>
            <span class="txt">{it.text}</span>
          </span>
        {/each}
      </div>
    {/key}
  </div>
</footer>

<style>
  .ticker {
    --cw: clamp(230px, 24vw, 400px);
    flex: none;
    display: flex;
    align-items: stretch;
    height: clamp(26px, 2.6vw, 42px);
    background: var(--ink-100);
    border-top: 1px solid var(--line-hi);
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
    animation: step 260ms cubic-bezier(0.22, 0.7, 0.3, 1);
  }
  .cells.still {
    animation: none;
  }
  @keyframes step {
    from {
      transform: translateX(calc(var(--cw) * -1));
    }
    to {
      transform: none;
    }
  }

  .ev {
    display: flex;
    align-items: baseline;
    gap: 7px;
    padding: 0 13px;
    border-right: 1px solid var(--line);
    font-size: clamp(9px, 0.68vw, 13px);
    line-height: 1;
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
