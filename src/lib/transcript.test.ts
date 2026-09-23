import { expect, it } from 'vitest'
import { mulberry32 } from './rng'
import { nextBlock } from './transcript'

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
