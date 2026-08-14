<script lang="ts">
  import { onMount } from 'svelte'
  import type { Swarm } from '../lib/swarm.svelte'
  import RollingNumber from './RollingNumber.svelte'

  interface Props {
    swarm: Swarm
    wallLabel?: string
  }
  const { swarm, wallLabel = 'fake-agent-wall' }: Props = $props()
  let windowsElement = $state<HTMLDivElement>()
  let visibleWindowCount = $state(1)

  const counts = $derived.by(() => {
    const c = { run: 0, cue: 0, hold: 0, done: 0 }
    for (const a of swarm.agents) c[a.status] += 1
    return c
  })

  const tc = $derived(swarm.timecode)
  const visibleWindows = $derived.by(() => {
    const count = Math.min(visibleWindowCount, swarm.agents.length)
    if (count >= swarm.agents.length) return swarm.agents.map((agent, index) => ({ agent, index }))
    if (count === 1) return [{ agent: swarm.agents[swarm.pgm]!, index: swarm.pgm }]
    const required = new Set([swarm.pgm])
    if (swarm.pst !== -1) required.add(swarm.pst)
    for (let distance = 1; required.size < count; distance += 1) {
      const before = swarm.pgm - distance
      const after = swarm.pgm + distance
      if (before >= 0) required.add(before)
      if (required.size < count && after < swarm.agents.length) required.add(after)
      if (before < 0 && after >= swarm.agents.length) break
    }
    return [...required].toSorted((a, b) => a - b).slice(0, count).map(index => ({ agent: swarm.agents[index]!, index }))
  })

  onMount(() => {
    const observer = new ResizeObserver(([entry]) => {
      if (!entry) return
      // One compact overflow tab is reserved whenever the full fleet cannot fit.
      visibleWindowCount = Math.max(1, Math.floor((entry.contentRect.width - 42) / 96))
    })
    if (windowsElement) observer.observe(windowsElement)
    return () => observer.disconnect()
  })
</script>

<!--
  A tmux status line, not a broadcast rail. This is the convention terminals
  already have for "the strip across the top", so the wall's chrome reads as
  something a developer has looked at ten thousand times: a session name on the
  left, the window list in the middle with the active one flagged, and the
  right status carrying counts and a clock.
-->
<header class="status">
  <span class="session" title={`[${wallLabel}]`}>[<span>{wallLabel}</span>]</span>

  <div class="windows" bind:this={windowsElement}>
    {#each visibleWindows as item (item.agent.slot)}
      <span
        class="win"
        class:active={item.index === swarm.pgm}
        class:cued={item.index === swarm.pst}
        data-state={item.agent.status}
        title={`${item.agent.slot}:${item.agent.label}`}
      >
        <span>{item.agent.slot}:{item.agent.label}{item.index === swarm.pgm ? '*' : item.agent.status === 'hold' ? '!' : ''}</span>
      </span>
    {/each}
    {#if visibleWindows.length < swarm.agents.length}
      <span class="more">+{swarm.agents.length - visibleWindows.length}</span>
    {/if}
  </div>

  <div class="right">
    <span class="seg live"><b><RollingNumber value={counts.run} label={`${counts.run} live`} /></b>&#8239;live</span>
    <span class="seg think"><b><RollingNumber value={counts.cue} label={`${counts.cue} thinking`} /></b>&#8239;think</span>
    <span class="seg hold"><b><RollingNumber value={counts.hold} label={`${counts.hold} held`} /></b>&#8239;hold</span>
    <span class="pipe metrics-pipe">│</span>
    <span class="seg"><b><RollingNumber value={(swarm.totalTokens / 1000).toFixed(1)} label={`${Math.round(swarm.totalTokens)} tokens`} />k</b>&#8239;tok</span>
    <span class="seg"><b><RollingNumber value={swarm.totalTools} label={`${swarm.totalTools} tool calls`} /></b>&#8239;calls</span>
    <span class="pipe clock-pipe">│</span>
    <span class="clock"><RollingNumber value={tc.slice(0, 8)} label={`time ${tc.slice(0, 8)}`} /></span>
  </div>
</header>

<style>
  .status {
    flex: none;
    display: flex;
    align-items: stretch;
    gap: 0;
    height: clamp(24px, 2.3vw, 36px);
    background: var(--ink-150);
    border-bottom: 1px solid var(--line-hi);
    /* Terminal register: the body face, not the broadcast label face. */
    font-family: var(--f-term);
    font-size: clamp(9.5px, 0.72vw, 14px);
    line-height: 1.2;
    white-space: nowrap;
    overflow: hidden;
  }

  /* tmux status-left: a solid block carrying the session name. */
  .session {
    flex: none;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0 12px;
    background: var(--coral);
    color: var(--on-coral);
    font-weight: 700;
    max-width: min(34vw, 260px);
  }
  .session > span {
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .windows {
    flex: 1;
    min-width: 0;
    display: flex;
    align-items: stretch;
    overflow: hidden;
    padding-left: 8px;
  }
  .win {
    flex: 1 1 96px;
    min-width: 64px;
    max-width: 132px;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0 9px;
    color: var(--txt-dim);
  }
  .win > span {
    min-width: 0;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
  }
  .more {
    flex: none;
    display: grid;
    place-items: center;
    min-width: 38px;
    padding: 0 7px;
    color: var(--txt-fnt);
  }
  .win[data-state='run'] {
    color: var(--txt-hi);
  }
  .win[data-state='hold'] {
    color: var(--hold);
  }
  .win[data-state='done'] {
    color: var(--txt-fnt);
  }
  /* The current window, in tmux's own idiom: reverse video, not a border. */
  .win.active {
    background: var(--live);
    color: var(--on-live);
    font-weight: 700;
  }
  .win.cued {
    background: var(--cue);
    color: var(--on-cue);
    font-weight: 700;
  }

  .right {
    flex: none;
    display: flex;
    align-items: center;
    gap: 9px;
    padding: 0 11px 0 14px;
    color: var(--txt-fnt);
  }
  .seg b {
    color: var(--txt-hi);
    font-weight: 700;
  }
  .seg.live b {
    color: var(--live);
  }
  .seg.think b {
    color: color-mix(in oklab, var(--live) 62%, var(--umd));
  }
  .seg.hold b {
    color: var(--hold);
  }
  .pipe {
    color: var(--line-hi);
  }
  .clock {
    color: var(--amber);
    font-weight: 700;
  }

  @media (max-width: 1180px) {
    .seg:not(.live):not(.hold) {
      display: none;
    }
    .metrics-pipe {
      display: none;
    }
  }
</style>
