<script lang="ts">
  import { onMount } from 'svelte'

  /**
   * The exit affordance for the desktop app.
   *
   * It only ever DISPLAYS. The main process owns the double-tap gesture and the
   * decision to quit, so a wedged page cannot trap the screen — this component
   * going missing costs the user a hint, never the exit.
   */
  const HOLD_MS = 2600
  /** Below this, a resting hand's jitter would keep the plate on screen. */
  const MOVE_PX = 3

  let visible = $state(false)
  let armed = $state(false)
  let within = $state(1500)
  /** Bumped on every surfacing so the countdown animation restarts. */
  let shown = $state(0)

  let timer: ReturnType<typeof setTimeout> | undefined
  let lastX = 0
  let lastY = 0
  let seeded = false

  function surface(isArmed: boolean) {
    armed = isArmed
    visible = true
    shown += 1
    clearTimeout(timer)
    timer = setTimeout(() => {
      visible = false
      armed = false
    }, HOLD_MS)
  }

  onMount(() => {
    const off = window.agentWall?.onHint((p) => {
      within = p.withinMs
      surface(p.armed)
    })

    const onMove = (e: PointerEvent) => {
      if (!seeded) {
        seeded = true
        lastX = e.clientX
        lastY = e.clientY
        return
      }
      if (Math.abs(e.clientX - lastX) < MOVE_PX && Math.abs(e.clientY - lastY) < MOVE_PX) return
      lastX = e.clientX
      lastY = e.clientY
      // A mouse move is a question, not a command: it asks how to get out.
      if (!armed) surface(false)
    }

    window.addEventListener('pointermove', onMove, { passive: true })
    return () => {
      window.removeEventListener('pointermove', onMove)
      clearTimeout(timer)
      off?.()
    }
  })
</script>

{#if visible}
  <div class="slate" class:armed role="status">
    <span class="tag umd-type">{armed ? 'arm' : 'exit'}</span>
    <span class="body">
      <span class="line umd-type">
        {#if armed}
          press <b>esc</b> again to stop
        {:else}
          double&#8209;tap <b>esc</b> to stop
        {/if}
      </span>
      {#if armed}
        {#key shown}
          <span class="fuse" style="--ms:{within}ms"></span>
        {/key}
      {/if}
    </span>
  </div>
{/if}

<style>
  .slate {
    position: fixed;
    left: 50%;
    bottom: clamp(52px, 7vh, 96px);
    transform: translateX(-50%);
    z-index: 40;
    display: flex;
    align-items: stretch;
    background: var(--ink-150);
    border: 1px solid var(--line-hi);
    border-radius: var(--r);
    box-shadow: 0 10px 40px rgb(0 0 0 / 70%);
    pointer-events: none;
    /* A hard cut in, like every other state change on this wall. */
    animation: cut 90ms steps(2) both;
  }
  @keyframes cut {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }
  .slate.armed {
    border-color: var(--live);
    box-shadow:
      0 0 0 1px color-mix(in oklab, var(--live) 45%, transparent),
      0 10px 40px rgb(0 0 0 / 70%);
  }

  .tag {
    display: grid;
    place-items: center;
    padding: 0 12px;
    background: var(--umd);
    color: var(--ink-000);
    font-weight: 700;
    letter-spacing: 0.18em;
  }
  .slate.armed .tag {
    background: var(--live);
    color: var(--on-live);
  }

  .body {
    position: relative;
    padding: 11px 18px 12px;
  }
  .line {
    font-size: clamp(10px, 0.86vw, 15px);
    letter-spacing: 0.13em;
    color: var(--txt-hi);
    white-space: nowrap;
  }
  .line b {
    color: var(--amber);
    font-weight: 700;
  }

  /* The window you have left, drawn as a burning fuse rather than a number. */
  .fuse {
    position: absolute;
    left: 0;
    bottom: 0;
    height: 2px;
    width: 100%;
    background: var(--live);
    transform-origin: left;
    animation: burn var(--ms) linear forwards;
  }
  @keyframes burn {
    from {
      transform: scaleX(1);
    }
    to {
      transform: scaleX(0);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .fuse {
      animation: none;
      transform: scaleX(1);
    }
  }
</style>
