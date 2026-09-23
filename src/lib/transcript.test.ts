import { expect, it } from 'vitest'
import { mulberry32 } from './rng'
import { LOADING_TEMPLATES, loadingBlock, nextBlock } from './transcript'

it('shows a decision quickly and retains its selected result for the recent-decision strip', () => {
  const random = mulberry32(23)
  const block = Array.from({ length: 100 }, () => nextBlock(random, 0, 'orchestration', 'make webhook replay idempotent'))
    .find(emits => emits[0]?.line.s.startsWith('● Decide('))

  expect(block).toBeDefined()
  expect(block?.map(emit => emit.line.s).join('\n')).toContain('choice · next step:')
  expect(block?.map(emit => emit.line.s).join('\n')).toContain('noul ·')
  expect(block?.every(emit => !emit.type)).toBe(true)
  expect(block?.every(emit => emit.fast)).toBe(true)
  expect(block?.[0]?.pause).toBeLessThanOrEqual(500)
  expect(block?.at(-1)?.recentDecision).toContain('jev ·')
  expect(block?.at(-1)?.line.s).toContain(block?.at(-1)?.recentDecision?.replace('jev · ', ''))
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
    expect(block.map(emit => emit.line.k)).toEqual(['tool', 'gut', 'cont', 'ok'])
    expect(block[0]?.line.s).toMatch(/^● Bash\(.+\)$/)
    expect(block.every(emit => emit.line.s.length > 0 && emit.pause > 0)).toBe(true)
  }
})

it('selects loading output during ordinary validation playback', () => {
  const random = mulberry32(42)
  const blocks = Array.from({ length: 80 }, () => nextBlock(random, 0, 'validation'))
  expect(blocks.some(block => block[0]?.line.s.includes('Bash(ollama pull') || block[0]?.line.s.includes('Bash(docker build') || block[0]?.line.s.includes('Bash(brew install') || block[0]?.line.s.includes('Bash(pnpm vite build'))).toBe(true)
})
