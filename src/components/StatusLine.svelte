<script lang="ts">
  import type { Swarm } from '../lib/swarm.svelte'
  import RollingNumber from './RollingNumber.svelte'

  interface Props {
    swarm: Swarm
  }
  const { swarm }: Props = $props()

  const counts = $derived.by(() => {
    const c = { run: 0, cue: 0, hold: 0, done: 0 }
    for (const a of swarm.agents) c[a.status] += 1
    return c
  })

  const tc = $derived(swarm.timecode)
</script>

<!--
  A tmux status line, not a broadcast rail. This is the convention terminals
  already have for "the strip across the top", so the wall's chrome reads as
  something a developer has looked at ten thousand times: a session name on the
  left, the window list in the middle with the active one flagged, and the
  right status carrying counts and a clock.
-->
<header class="status">
  <span class="session">[fake-agent-wall]</span>

  <div class="windows">
    {#each swarm.agents as a, i (a.slot)}
      <span
        class="win"
        class:active={i === swarm.pgm}
        class:cued={i === swarm.pst}
        data-state={a.status}
      >
        {a.slot}:{a.label}{i === swarm.pgm ? '*' : a.status === 'hold' ? '!' : ''}
      </span>
    {/each}
  </div>

  <div class="right">
    <span class="seg live"><b><RollingNumber value={counts.run} label={`${counts.run} live`} /></b>&#8239;live</span>
    <span class="seg think"><b><RollingNumber value={counts.cue} label={`${counts.cue} thinking`} /></b>&#8239;think</span>
    <span class="seg hold"><b><RollingNumber value={counts.hold} label={`${counts.hold} held`} /></b>&#8239;hold</span>
    <span class="pipe">│</span>
    <span class="seg"><b><RollingNumber value={(swarm.totalTokens / 1000).toFixed(1)} label={`${Math.round(swarm.totalTokens)} tokens`} />k</b>&#8239;tok</span>
    <span class="seg"><b><RollingNumber value={swarm.totalTools} label={`${swarm.totalTools} tool calls`} /></b>&#8239;calls</span>
    <span class="pipe">│</span>
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
    line-height: 1;
    white-space: nowrap;
    overflow: hidden;
  }

  /* tmux status-left: a solid block carrying the session name. */
  .session {
    flex: none;
    display: grid;
    place-items: center;
    padding: 0 12px;
    background: var(--coral);
    color: var(--on-coral);
    font-weight: 700;
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
    flex: 0 1 auto;
    min-width: 0;
    display: grid;
    place-items: center;
    padding: 0 9px;
    color: var(--txt-dim);
    overflow: hidden;
    text-overflow: ellipsis;
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
  }
  @media (max-width: 860px) {
    .windows {
      display: none;
    }
  }
</style>
