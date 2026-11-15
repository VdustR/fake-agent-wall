import { expect, it } from 'vitest'
import { describeTool } from './tool-workload'
import { nextBlock } from './transcript'
import { mulberry32 } from './rng'

it.each([
  ['pnpm tsc --noEmit', 'check'],
  ['pnpm exec eslint src', 'lint'],
  ['pnpm eslint --concurrency auto src', 'lint-parallel'],
  ['pnpm oxlint --type-aware', 'lint-parallel'],
  ['pnpm eslint --concurrency 16 src', 'lint-parallel'],
  ['uv run ruff check src', 'lint-parallel'],
  ['cargo build --release', 'rust'],
  ['pnpm vite build', 'build'],
  ['uv run pytest -q', 'test-single'],
  ['pnpm vitest run', 'test'],
  ["printf 'cargo build'", 'utility'],
])('classifies the executed tool, not words inside arguments: %s', (command, profile) => {
  expect(describeTool('● Bash(' + command + ')')).toMatchObject({ command, profile, shell: true })
})

it('attaches execution metadata and a result boundary to every generated tool block', () => {
  const random = mulberry32(42)
  let tools = 0
  for (let index = 0; index < 500; index++) {
    const block = nextBlock(random, 0, 'validation')
    const calls = block.filter(emit => emit.line.k === 'tool')
    if (!calls.length) continue
    tools += calls.length
    expect(calls.every(emit => emit.tool && emit.line.s.includes(emit.tool.command))).toBe(true)
    expect(block.at(-1)?.toolEnd).toBe(true)
  }
  expect(tools).toBeGreaterThan(100)
})
