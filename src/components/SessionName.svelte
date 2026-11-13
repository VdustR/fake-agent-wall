<script lang="ts">
  interface Props { text: string; active: boolean; phase?: number }
  const { text, active, phase = 0 }: Props = $props()
</script>

<span class="session-light" class:running={active} style={`--sweep-delay: -${phase % 3800}ms`}>
  <span>{text}</span><span class="light" aria-hidden="true">{text}</span>
</span>

<style>
  .session-light { position: relative; display: inline-block; white-space: nowrap; }
  .light { display: none; user-select: none; -webkit-user-select: none; }
  @supports (mask-image: linear-gradient(black, transparent)) {
    .running .light {
      display: block;
      position: absolute;
      inset: 0;
      pointer-events: none;
      color: var(--session-glint, var(--txt-hi));
      text-shadow: 0 0 2px currentColor;
      mask-image: linear-gradient(110deg, transparent 35%, black 50%, transparent 65%);
      mask-size: 300% 100%;
      mask-position: 100% 50%;
      animation: session-sweep 3800ms linear infinite;
      animation-delay: var(--sweep-delay);
    }
  }
  /* Keep the readable base ink steady while a text-shaped light passes over it. */
  @keyframes session-sweep {
    0% { mask-position: 100% 50%; }
    65%, 100% { mask-position: 0% 50%; }
  }
  @media (prefers-reduced-motion: reduce), (forced-colors: active) {
    .running .light { display: none; animation: none; }
  }
</style>
