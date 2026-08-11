<script lang="ts">
  import type { Agent } from '../lib/agent.svelte'

  interface Props {
    agent: Agent
    /** Milliseconds from the swarm clock; drives the spinner and cursor. */
    beat: number
    pgm?: boolean
    calm?: boolean
  }

  const { agent, beat, pgm = false, calm = false }: Props = $props()

  // The real client cycles this glyph set while a turn is in flight.
  const GLYPHS = ['·', '✢', '✳', '∗', '✻', '✽']

  const glyph = $derived(calm ? '✻' : GLYPHS[Math.floor(beat / 110) % GLYPHS.length])
  // Held steady rather than blinking when the viewer asked for less motion.
  const blink = $derived(calm || Math.floor(beat / 530) % 2 === 0)
  const secs = $derived(Math.floor(agent.sessionMs / 1000) % 600)
  const kTok = $derived(((agent.tokensUp + agent.tokensDown) / 1000).toFixed(1))
</script>

<div class="term" class:pgm>
  <div class="log">
    {#each agent.lines as l}
      {#if l.k === 'tool'}
        <div class="ln tool"><b class="bul">⏺</b>{l.s.slice(1)}</div>
      {:else}
        <div class="ln {l.k}">{l.s || ' '}</div>
      {/if}
    {/each}

    {#if agent.partial}
      {#if agent.partial.k === 'tool'}
        <div class="ln tool"><b class="bul">⏺</b>{agent.partial.s.slice(1)}<i
            class="cur"
            class:on={blink}
          ></i></div>
      {:else}
        <div class="ln {agent.partial.k}">{agent.partial.s}<i class="cur" class:on={blink}></i></div>
      {/if}
    {/if}

    {#if agent.status === 'cue'}
      <div class="ln spin">
        <span class="gl">{glyph}</span>
        {agent.verb}…
        <span class="meta">({secs}s · ↑ {kTok} tokens · esc to interrupt)</span>
      </div>
    {/if}

    {#if agent.prompt}
      <div class="ask">
        <div class="ask-t">{agent.prompt.title}</div>
        {#each agent.prompt.body as b, i}
          <div class="ask-b" class:sub={i > 0}>{b}</div>
        {/each}
        <div class="ask-q">{agent.prompt.question}</div>
        {#each agent.prompt.options as o, i}
          <div class="ask-o" class:sel={i === 0}>{i === 0 ? '❯' : ' '} {i + 1}. {o}</div>
        {/each}
      </div>
    {/if}
  </div>

  <div class="bar">
    <span class="mode">⏵⏵ accept edits on</span>
    <span class="left">{agent.model} · {Math.round(agent.contextLeft)}% context left</span>
  </div>
</div>

<style>
  .term {
    display: flex;
    flex-direction: column;
    min-height: 0;
    height: 100%;
    background: var(--ink-050);
    font-size: clamp(9px, 0.67vw, 13px);
    line-height: 1.44;
  }
  .term.pgm {
    font-size: clamp(10.5px, 0.84vw, 16px);
    line-height: 1.5;
  }

  .log {
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
    overflow: hidden;
    padding: 0.5em 0.7em;
  }

  .gl {
    display: inline-block;
    width: 1ch;
  }

  .cur {
    display: inline-block;
    width: 0.62em;
    height: 1em;
    margin-left: 0.5px;
    vertical-align: text-bottom;
    background: transparent;
  }
  .cur.on {
    background: var(--coral);
  }

  /* Permission prompt: the real client draws a rounded box around it. */
  .ask {
    flex: none;
    margin-top: 0.55em;
    border: 1px solid var(--coral);
    border-radius: 4px;
    padding: 0.5em 0.7em;
    background: color-mix(in oklab, var(--coral) 8%, var(--ink-050));
  }
  .ask-t {
    color: var(--coral);
  }
  .ask-b {
    color: var(--txt);
    padding-left: 1.5ch;
    margin-top: 0.3em;
    white-space: pre-wrap;
    overflow-wrap: anywhere;
  }
  .ask-b.sub {
    color: var(--txt-fnt);
    margin-top: 0.1em;
  }
  .ask-q {
    color: var(--txt-hi);
    margin-top: 0.55em;
  }
  .ask-o {
    color: var(--txt-dim);
    white-space: pre-wrap;
    overflow-wrap: anywhere;
  }
  .ask-o.sel {
    color: var(--coral);
  }

  .bar {
    flex: none;
    display: flex;
    justify-content: space-between;
    gap: 1ch;
    padding: 0.35em 0.75em 0.45em;
    border-top: 1px solid var(--line);
    background: var(--ink-000);
    font-size: 0.92em;
    white-space: nowrap;
    overflow: hidden;
  }
  .mode,
  .left {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .mode {
    color: color-mix(in oklab, var(--add) 62%, var(--txt-fnt));
  }
  .left {
    flex: none;
    color: var(--txt-fnt);
  }

  @media (max-width: 720px) {
    /* A phone-width tile has room for transcript or for chrome, not both.
       The mode line is the first thing worth trading for two more lines. */
    .term:not(.pgm) .bar {
      display: none;
    }
    .log {
      padding: 0.3em 0.5em;
    }
  }
</style>
