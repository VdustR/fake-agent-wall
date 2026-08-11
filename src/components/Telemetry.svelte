<script lang="ts">
  import type { Swarm } from '../lib/swarm.svelte'

  interface Props {
    swarm: Swarm
  }
  const { swarm }: Props = $props()

  /**
   * Full-scale references for the bus meters. A PPM is only readable because its
   * scale is fixed and printed; a bar that rescales itself measures nothing.
   */
  const FS_TOKENS = 60_000
  const FS_TOOLS = 300

  const TICKS = [0, 20, 40, 60, 80, 100]
  /** Where the graticule prints its reference mark, as a percentage of scale. */
  const REF = 70

  const norm = (v: number, fs: number) => Math.max(0, Math.min(1, v / fs))

  const channels = $derived([
    {
      key: 'tok',
      label: 'tokens / min',
      value: norm(swarm.tokensPerMin, FS_TOKENS),
      peak: norm(swarm.peakTokens, FS_TOKENS),
      flat: false,
      read: `${(swarm.tokensPerMin / 1000).toFixed(1)}k`,
    },
    {
      key: 'tools',
      label: 'tool calls / min',
      value: norm(swarm.toolsPerMin, FS_TOOLS),
      peak: norm(swarm.peakTools, FS_TOOLS),
      flat: false,
      read: `${Math.round(swarm.toolsPerMin)}`,
    },
    {
      key: 'src',
      label: 'sources live',
      value: swarm.running / swarm.agents.length,
      peak: 0,
      // Every source working is the nominal state here, not an overload, so this
      // channel does not run into the red the way a throughput channel does.
      flat: true,
      read: `${swarm.running}/${swarm.agents.length}`,
    },
  ])
</script>

<section class="tel">
  <header class="bar umd-type">
    <span class="who">swarm bus</span>
    <span class="unit">ppm · % of scale</span>
  </header>

  <!-- Bus meters on one printed scale, the way a meter bridge is silkscreened. -->
  <div class="bus">
    {#each channels as c (c.key)}
      <div class="ch">
        <span class="lb umd-type">{c.label}</span>
        <span class="ppm">
          <i class="fill" class:flat={c.flat} style="--v:{c.value}"></i>
          {#if c.peak > 0.01}<i class="cap" style="--p:{c.peak}"></i>{/if}
          <i class="ref" style="--at:{REF}%"></i>
        </span>
        <span class="read tnum">{c.read}</span>
      </div>
    {/each}

    <div class="grat" aria-hidden="true">
      <span class="lb umd-type"></span>
      <span class="scale">
        {#each TICKS as t}
          <b style="--t:{t}%"><em class="umd-type tnum">{t}</em></b>
        {/each}
      </span>
      <span></span>
    </div>
  </div>

  <!-- Swarm output pressure over the last ~12 seconds. Synthetic, like all of it. -->
  <div class="hist">
    <span class="axis umd-type">output pressure</span>
    <div class="bars" aria-hidden="true">
      {#each swarm.history as h, i}
        <i style="--h:{Math.max(0.03, h)}" class:lead={i > swarm.history.length - 4}></i>
      {/each}
    </div>
    {#each [75, 50, 25] as r}
      <span class="rule" style="--at:{r}" aria-hidden="true"
        ><em class="umd-type tnum">{r}</em></span
      >
    {/each}
  </div>

  <!-- Meter bridge: context remaining on every source, read at a glance. -->
  <div class="bridge">
    <span class="blabel umd-type">context<br />remaining</span>
    <div class="cols">
      {#each swarm.agents as a (a.slot)}
        <div class="col">
          <span class="pc umd-type tnum">{Math.round(a.contextLeft)}</span>
          <span class="track"
            ><i style="--h:{a.contextLeft / 100}" data-low={a.contextLeft < 25}></i></span
          >
          <span class="id umd-type tnum">{a.numLabel}</span>
        </div>
      {/each}
    </div>
  </div>
</section>

<style>
  .tel {
    flex: none;
    display: flex;
    flex-direction: column;
    background: var(--ink-100);
    border: 1px solid var(--line-hi);
    border-radius: var(--r);
    overflow: hidden;
  }

  .bar {
    display: flex;
    justify-content: space-between;
    padding: 5px 12px 6px;
    background: var(--ink-150);
    border-bottom: 1px solid var(--line);
  }
  .who {
    color: var(--umd);
    font-weight: 700;
  }
  .unit {
    color: var(--txt-fnt);
  }

  .bus {
    padding: 8px 12px 7px;
  }
  .ch,
  .grat {
    display: grid;
    grid-template-columns: clamp(64px, 7.5vw, 108px) minmax(0, 1fr) clamp(44px, 5vw, 72px);
    align-items: center;
    gap: 10px;
  }
  .ch + .ch {
    margin-top: 5px;
  }
  .lb {
    color: var(--txt-fnt);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .read {
    font-family: var(--f-umd);
    font-weight: 700;
    font-size: clamp(9.5px, 0.86vw, 15px);
    line-height: 1;
    color: var(--amber);
    text-align: right;
  }

  .ppm {
    position: relative;
    display: block;
    height: clamp(9px, 0.95vw, 15px);
    background: var(--ink-050);
    box-shadow: inset 0 0 0 1px var(--line);
    /* Segment rules, the way a real ladder is printed rather than drawn. */
    background-image: repeating-linear-gradient(
      90deg,
      transparent 0 calc(5% - 1px),
      var(--ink-100) calc(5% - 1px) 5%
    );
  }
  /* The scale colours belong to the TRACK, not to the fill: a bar drawn with its
     own gradient shows "into the red" at 10% of scale, which is a lie. The fill
     spans the whole track and is clipped back to the reading. */
  .fill {
    position: absolute;
    inset: 1px;
    background: linear-gradient(90deg, var(--cue) 0 62%, var(--amber) 62% 84%, var(--live) 84%);
    clip-path: inset(0 calc(100% - var(--v) * 100%) 0 0);
  }
  .fill.flat {
    background: var(--cue);
  }
  .cap {
    position: absolute;
    top: 1px;
    bottom: 1px;
    left: calc(var(--p) * 100%);
    width: 2px;
    background: var(--amber);
  }
  .ref {
    position: absolute;
    top: -2px;
    bottom: -2px;
    left: var(--at);
    width: 1px;
    background: var(--umd);
    opacity: 0.75;
  }

  .grat {
    margin-top: 4px;
  }
  .scale {
    position: relative;
    display: block;
    height: 12px;
  }
  .scale b {
    position: absolute;
    left: var(--t);
    top: 0;
    width: 1px;
    height: 3px;
    background: var(--line-hi);
  }
  .scale em {
    position: absolute;
    top: 4px;
    left: 0;
    transform: translateX(-50%);
    font-style: normal;
    color: var(--txt-fnt);
  }

  .hist {
    position: relative;
    /* Left gutter reserved for the scale numerals, so they never sit on a bar. */
    padding: 7px 12px 9px 34px;
    border-top: 1px solid var(--line);
    background: var(--ink-050);
  }
  .bars {
    display: flex;
    align-items: flex-end;
    gap: 1px;
    height: clamp(32px, 3.6vw, 56px);
  }
  .bars i {
    flex: 1;
    min-width: 0;
    height: calc(var(--h) * 100%);
    background: color-mix(in oklab, var(--coral) 58%, var(--ink-200));
  }
  .bars i.lead {
    background: var(--coral);
  }
  .axis {
    position: absolute;
    top: 7px;
    right: 12px;
    color: var(--txt-fnt);
    z-index: 1;
  }
  /* Ruled and numbered: an unlabelled gridline measures nothing. */
  .rule {
    position: absolute;
    left: 34px;
    right: 12px;
    /* --at is unitless on purpose: calc() has no valid percentage-times-length
       product, and the earlier percentage form silently resolved to auto. */
    bottom: calc(9px + var(--at) * 0.01 * clamp(32px, 3.6vw, 56px));
    height: 1px;
    background: var(--line-hi);
    pointer-events: none;
  }
  .rule em {
    position: absolute;
    right: 100%;
    top: 50%;
    transform: translateY(-50%);
    padding-right: 5px;
    font-style: normal;
    color: var(--txt-fnt);
  }

  .bridge {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr);
    align-items: end;
    gap: 12px;
    padding: 8px 12px 9px;
    border-top: 1px solid var(--line);
  }
  .blabel {
    color: var(--txt-fnt);
    line-height: 1.5;
    padding-bottom: 11px;
  }
  .cols {
    display: grid;
    grid-template-columns: repeat(9, minmax(0, 1fr));
    gap: clamp(3px, 0.5vw, 9px);
  }
  .col {
    display: grid;
    justify-items: center;
    gap: 3px;
  }
  .pc {
    color: var(--txt-dim);
  }
  .track {
    display: block;
    width: 100%;
    height: clamp(14px, 1.5vw, 24px);
    background: var(--ink-050);
    box-shadow: inset 0 0 0 1px var(--line);
    position: relative;
    overflow: hidden;
  }
  /* Scaled rather than resized: nine of these move at once, and only transform
     stays off the layout path. */
  .track i {
    position: absolute;
    inset: 0;
    transform: scaleY(var(--h));
    transform-origin: bottom;
    background: color-mix(in oklab, var(--cue) 55%, var(--ink-200));
    transition: transform 300ms linear;
  }
  .track i[data-low='true'] {
    background: var(--hold);
  }
  .id {
    color: var(--txt-fnt);
  }

  @media (max-width: 720px) {
    /* The wall itself is the scarce thing on a phone; the bridge is the
       readout that survives being dropped. */
    .bridge {
      display: none;
    }
    .bars {
      height: 30px;
    }
  }
</style>
