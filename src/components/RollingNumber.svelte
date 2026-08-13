<script lang="ts">
  interface Props { value: string | number; label?: string }
  const { value, label }: Props = $props()
  const chars = $derived(String(value).split(''))
</script>

<span class="roller tnum" aria-label={label ?? String(value)}>
  {#each chars as char, index (index)}
    {#if /\d/.test(char)}
      <span class="digit" aria-hidden="true"><i style:transform={`translateY(-${Number(char)}em)`}>{#each Array(10) as _, n}<b>{n}</b>{/each}</i></span>
    {:else}<span aria-hidden="true">{char}</span>{/if}
  {/each}
</span>

<style>
  .roller { display: inline-flex; align-items: baseline; font: inherit; }
  .digit { display: inline-block; width: .64em; height: 1em; overflow: hidden; }
  .digit i { display: flex; flex-direction: column; font-style: normal; transition: transform 520ms cubic-bezier(.16, 1, .3, 1); }
  .digit b { display: block; height: 1em; line-height: 1em; font: inherit; }
  @media (prefers-reduced-motion: reduce) { .digit i { transition: none; } }
</style>
