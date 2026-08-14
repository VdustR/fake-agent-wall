<script lang="ts">
  import { cubicOut } from 'svelte/easing'
  import type { TransitionConfig } from 'svelte/transition'
  import type { OpsNotice } from '../lib/operations.svelte'
  interface Props { notice: OpsNotice | null }
  const { notice }: Props = $props()

  function noticeOut(_node: HTMLElement): TransitionConfig {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    return {
      duration: reducedMotion ? 0 : 220,
      easing: cubicOut,
      css: t => `opacity: ${t}; transform: translateY(${(1 - t) * -8}px) scale(${0.985 + t * 0.015});`,
    }
  }
</script>

{#if notice}
  <aside class="notice" data-tone={notice.tone} aria-live="polite" out:noticeOut>
    <i></i>
    <div><span class="umd-type">{notice.eyebrow}</span><strong>{notice.title}</strong><p>{notice.detail}</p></div>
    <b class="umd-type">event</b>
  </aside>
{/if}

<style>
  .notice { --signal: var(--coral); position: fixed; z-index: 80; top: clamp(42px, 4vw, 62px); right: var(--gap); width: min(430px, calc(100vw - 24px)); min-height: 58px; display: grid; grid-template-columns: 5px 1fr auto; align-items: stretch; background: var(--ink-150); border: 1px solid var(--signal); box-shadow: 0 12px 30px rgba(0,0,0,.38); animation: arrive 460ms cubic-bezier(.18,.8,.24,1); }
  .notice[data-tone='green'] { --signal: var(--cue); }
  .notice[data-tone='amber'] { --signal: var(--hold); }
  .notice[data-tone='blue'] { --signal: var(--done); }
  .notice > i { background: var(--signal); }
  .notice > div { padding: 8px 11px 9px; }
  .notice span { color: var(--signal); letter-spacing: .12em; }
  .notice strong { display: block; width: fit-content; max-width: 100%; margin-top: 4px; color: var(--txt-hi); font: 600 15px/1.4 var(--f-editorial); white-space: nowrap; overflow: hidden; animation: typing 620ms steps(28, end) 160ms both; }
  .notice p { width: fit-content; max-width: 100%; margin-top: 5px; color: var(--txt-dim); font: 9px/1.2 var(--f-term); white-space: nowrap; overflow: hidden; animation: typing 820ms steps(46, end) 650ms both; }
  .notice > b { align-self: start; padding: 8px; color: var(--ink-000); background: var(--signal); letter-spacing: .14em; }
  @keyframes arrive { from { transform: translateX(18px); clip-path: inset(0 0 0 100%); } to { transform: translateX(0); clip-path: inset(0); } }
  @keyframes typing { from { max-width: 0; } to { max-width: 100%; } }
  @media (prefers-reduced-motion: reduce) { .notice, .notice strong, .notice p { animation: none; } }
</style>
