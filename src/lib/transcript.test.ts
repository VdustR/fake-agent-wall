import { expect, it } from 'vitest'
import { mulberry32 } from './rng'
import { LOADING_TEMPLATES, loadingBlock, nextBlock } from './transcript'

it('shows a decision quickly and retains its selected result for the recent-decision strip', () => {
  const random = mulberry32(23)
  const block = Array.from({ length: 100 }, () => nextBlock(random, 0, 'orchestration', 'make webhook replay idempotent'))
    .find(emits => emits[0]?.line.s.startsWith('● Decide(typesafe /'))

  expect(block).toBeDefined()
  expect(block?.map(emit => emit.line.s).join('\n')).toContain('choice · next step:')
  expect(block?.map(emit => emit.line.s).join('\n')).toContain('noul ·')
  expect(block?.every(emit => !emit.type)).toBe(true)
  expect(block?.every(emit => emit.fast)).toBe(true)
  expect(block?.[0]?.pause).toBeLessThanOrEqual(500)
  expect(block?.at(-1)?.recentDecision).toContain('jev ·')
  expect(block?.at(-1)?.line.s).toContain(block?.at(-1)?.recentDecision?.replace('jev · ', ''))
})

it('shows all four current decision routes with typed probabilities and scores', () => {
  const random = mulberry32(23)
  const blocks = Array.from({ length: 1200 }, () => nextBlock(random, 0, 'orchestration', 'make webhook replay idempotent'))
    .filter(emits => emits[0]?.line.s.startsWith('● Decide('))
  for (const route of ['typesafe / jev', 'openai / Decisions API / luna', 'google / Gemini Decisions API / gemini-decision-1', 'microsoft / Microsoft Foundry / microsoft-decision-1']) {
    const matched = blocks.filter(block => block[0]!.line.s.includes(route))
    expect(matched.length, route).toBeGreaterThan(0)
    for (const block of matched) {
      const text = block.map(emit => emit.line.s).join('\n')
      expect(text).not.toContain('(preview)')
      expect(text).toContain('inspect replay guard 0.81')
      expect(text).toContain('p(yes)=0.87')
      expect(text).toContain('score · review priority: 1.05 / 2')
      expect(text).toContain('confidence=')
      if (route.startsWith('typesafe')) expect(text).toContain('noul ·')
      else expect(text).not.toContain('noul ·')
      expect(block.every(emit => !emit.type && emit.fast)).toBe(true)
      expect(block[0]?.pause).toBeLessThanOrEqual(500)
      expect(block.at(-1)?.recentDecision).toContain(' · inspect replay guard')
    }
  }
})

it('does not inject an unrelated decision into another task', () => {
  const random = mulberry32(23)
  const blocks = Array.from({ length: 100 }, () => nextBlock(random, 0, 'orchestration', 'move the diff renderer to a worker'))
  expect(blocks.some(emits => emits[0]?.line.s.startsWith('● Decide('))).toBe(false)
})

it('keeps each install and build transcript together with a command, progress, and completion', () => {
  const random = mulberry32(42)
  expect(LOADING_TEMPLATES).toEqual([
    'gpt', 'brew', 'mise', 'pnpm', 'vite', 'rolldown', 'typescript', 'rust', 'go', 'docker',
  ])
  for (const template of LOADING_TEMPLATES) {
    const block = loadingBlock(random, template)
    const install = ['gpt', 'brew', 'mise', 'pnpm'].includes(template)
    expect(block.map(emit => emit.line.k)).toEqual(install
      ? ['tool', 'gut', 'cont', 'cont', 'cont', 'cont', 'ok']
      : ['tool', 'gut', 'cont', 'ok'])
    expect(block[0]?.line.s).toMatch(/^● Bash\(.+\)$/)
    expect(block.every(emit => emit.line.s.length > 0 && emit.pause > 0)).toBe(true)
    if (install) {
      const progress = block.slice(2, -1)
      const percents = progress.map(emit => Number(emit.line.s.match(/\] (\d+)%/)?.[1]))
      expect(percents).toEqual(percents.toSorted((a, b) => a - b))
      expect(percents.at(-1)).toBe(100)
      expect(progress.map(emit => emit.replacePrevious)).toEqual([false, true, true, true])
      expect(progress.every(emit => /\[[█░]{10}\]/.test(emit.line.s))).toBe(true)
    }
  }
})

it('selects loading output during ordinary validation playback', () => {
  const random = mulberry32(42)
  const blocks = Array.from({ length: 80 }, () => nextBlock(random, 0, 'validation'))
  expect(blocks.some(block => block[0]?.line.s.includes('Bash(ollama pull') || block[0]?.line.s.includes('Bash(docker build') || block[0]?.line.s.includes('Bash(brew install') || block[0]?.line.s.includes('Bash(pnpm vite build'))).toBe(true)
})

it('distinguishes a negative binary answer from confidence in that answer', () => {
  const random = mulberry32(23)
  const blocks = Array.from({ length: 200 }, () => nextBlock(random, 0, 'orchestration', 'close the keyboard trap in the billing modal'))
    .filter(block => block[0]?.line.s.startsWith('● Decide('))
  expect(blocks.length).toBeGreaterThan(0)
  for (const block of blocks) expect(block.map(emit => emit.line.s).join('\n')).toContain('p(yes)=0.06 · confidence=0.94')
})
