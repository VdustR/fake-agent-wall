/**
 * Fabricates vendor-neutral coding-agent transcript blocks. The output borrows
 * ordinary shell, diff, task-list and permission conventions without copying a
 * specific client surface.
 */
import {
  BASH,
  BASH_DESC,
  CODE_SCENES,
  DIRS,
  ERRORS,
  FILES,
  PROSE,
  SUBAGENTS,
  SYMBOLS,
  TASKS,
  TODOS,
} from './corpus'
import { chance, int, pick, sample, type Rand } from './rng'

export type Kind =
  | 'tool'
  | 'gut'
  | 'cont'
  | 'add'
  | 'del'
  | 'ctx'
  | 'todo-done'
  | 'todo-open'
  | 'text'
  | 'dim'
  | 'err'
  | 'ok'
  | 'user'
  | 'rule'

export interface Line {
  k: Kind
  s: string
}

/** One unit of output. `type` streams it character by character; otherwise it lands whole. */
export interface Emit {
  line: Line
  type: boolean
  /** Milliseconds of quiet after this line commits. */
  pause: number
}

export interface Prompt {
  title: string
  body: string[]
  question: string
  options: string[]
}

const t = (k: Kind, s: string, type = false, pause = 0): Emit => ({ line: { k, s }, type, pause })

const num = (n: number, w = 5) => String(n).padStart(w, ' ')

const path = (r: Rand) => `${pick(r, DIRS)}/${pick(r, FILES)}`

const k = (r: Rand, lo: number, hi: number) => `${(lo + r() * (hi - lo)).toFixed(1)}k`

/* ------------------------------------------------------------------ blocks */

function readBlock(r: Rand): Emit[] {
  const p = path(r)
  return [
    t('tool', `● Read(${p})`, true, 260),
    t('gut', `  └  Read ${int(r, 24, 486)} lines`, false, 420),
  ]
}

function grepBlock(r: Rand): Emit[] {
  const pat = pick(r, SYMBOLS).replace('(', '\\(')
  const dir = pick(r, DIRS).split('/')[0] as string
  const hits = int(r, 3, 47)
  return [
    t('tool', `● Grep(pattern: "${pat}", path: "${dir}")`, true, 300),
    t('gut', `  └  Found ${hits} file${hits === 1 ? '' : 's'}`, false, 380),
  ]
}

function globBlock(r: Rand): Emit[] {
  const dir = pick(r, DIRS)
  return [
    t('tool', `● Glob(${dir}/**/*.ts)`, true, 240),
    t('gut', `  └  ${int(r, 6, 92)} paths`, false, 340),
  ]
}

function bashBlock(r: Rand): Emit[] {
  const i = int(r, 0, BASH.length - 1)
  const cmd = BASH[i] as string
  const out: Emit[] = [t('tool', `● Bash(${cmd})`, true, 340)]

  if (cmd.startsWith('pnpm vitest')) {
    const files = int(r, 2, 6)
    const tests = int(r, 18, 240)
    const failing = chance(r, 0.22)
    out.push(t('gut', `  └  ${'·'.repeat(int(r, 14, 34))}`, false, 260))
    for (let n = 0; n < files; n++) {
      out.push(
        t('cont', `     ✓ ${pick(r, DIRS)}/${pick(r, FILES).replace('.ts', '.test.ts')} (${int(r, 4, 31)} tests) ${int(r, 18, 940)}ms`, false, 60),
      )
    }
    if (failing) {
      out.push(t('err', `     ${pick(r, ERRORS)}`, false, 120))
      out.push(t('err', `     ${pick(r, ERRORS)}`, false, 200))
      out.push(t('cont', `     Test Files  1 failed | ${files - 1} passed (${files})`, false, 60))
      out.push(t('cont', `          Tests  1 failed | ${tests - 1} passed (${tests})`, false, 520))
    } else {
      out.push(t('cont', '', false, 40))
      out.push(t('ok', `     Test Files  ${files} passed (${files})`, false, 60))
      out.push(t('ok', `          Tests  ${tests} passed (${tests})`, false, 60))
      out.push(t('cont', `       Duration  ${(r() * 9 + 0.6).toFixed(2)}s`, false, 520))
    }
    return out
  }

  if (cmd.startsWith('pnpm oxlint')) {
    out.push(t('gut', `  └  Finished in ${int(r, 31, 240)}ms on ${int(r, 180, 2400)} files with 96 rules using ${int(r, 8, 14)} threads.`, false, 90))
    out.push(t('ok', `     Found 0 warnings and 0 errors.`, false, 480))
    return out
  }

  if (cmd.startsWith('pnpm tsc')) {
    if (chance(r, 0.3)) {
      out.push(t('gut', `  └  ${path(r)}(${int(r, 12, 300)},${int(r, 3, 60)}): ${pick(r, ERRORS)}`, false, 120))
      out.push(t('err', `     Found 1 error in 1 file.`, false, 460))
    } else {
      out.push(t('gut', `  └  (no output)`, false, 420))
    }
    return out
  }

  if (cmd.startsWith('git log')) {
    for (let n = 0; n < 5; n++) {
      out.push(
        t(n === 0 ? 'gut' : 'cont', `${n === 0 ? '  └  ' : '     '}${hex(r, 7)} ${pick(r, TASKS)}`, false, 55),
      )
    }
    out.push(t('cont', '', false, 380))
    return out
  }

  if (cmd.startsWith('git diff')) {
    const files = int(r, 2, 5)
    for (let n = 0; n < files; n++) {
      const add = int(r, 1, 60)
      const del = int(r, 0, 24)
      out.push(
        t(n === 0 ? 'gut' : 'cont', `${n === 0 ? '  └  ' : '     '}${path(r)} | ${add + del} ${'+'.repeat(Math.min(add, 12))}${'-'.repeat(Math.min(del, 6))}`, false, 60),
      )
    }
    out.push(t('cont', `     ${files} files changed`, false, 400))
    return out
  }

  if (cmd.startsWith('pnpm bench')) {
    out.push(t('gut', `  └  queue.push        ${int(r, 180, 900)} ops/s   ±${(r() * 3).toFixed(2)}%`, false, 80))
    out.push(t('cont', `     queue.flush       ${int(r, 40, 300)} ops/s   ±${(r() * 3).toFixed(2)}%`, false, 80))
    out.push(t('cont', `     policy.next    ${int(r, 4000, 90000)} ops/s   ±${(r() * 2).toFixed(2)}%`, false, 460))
    return out
  }

  out.push(t('gut', `  └  ${pick(r, BASH_DESC)} — ok (${int(r, 40, 3200)}ms)`, false, 420))
  return out
}

function editBlock(r: Rand): Emit[] {
  const scene = pick(r, CODE_SCENES)
  const p = scene.path
  const adds = scene.after.length
  const dels = scene.before.length
  const start = int(r, 12, 320)
  const out: Emit[] = [
    t('tool', `● Update(${p})`, true, 300),
    t('gut', `  └  Updated ${p} with ${adds} additions and ${dels} removals`, false, 200),
  ]
  let ln = start
  out.push(t('ctx', `    ${num(ln++)}    ${scene.context[0]}`, false, 45))
  for (const line of scene.before) out.push(t('del', `    ${num(ln)} -  ${line}`, false, 55))
  for (const line of scene.after) out.push(t('add', `    ${num(ln++)} +  ${line}`, false, 55))
  for (const line of scene.context.slice(1)) out.push(t('ctx', `    ${num(ln++)}    ${line}`, false, 45))
  out.push(t('cont', '', false, 480))
  return out
}

function writeBlock(r: Rand): Emit[] {
  const p = path(r)
  return [
    t('tool', `● Write(${p})`, true, 320),
    t('gut', `  └  Wrote ${int(r, 18, 260)} lines to ${p}`, false, 460),
  ]
}

function todoBlock(r: Rand, done: number): Emit[] {
  const items = sample(r, TODOS, int(r, 4, 6))
  const out: Emit[] = [t('tool', '● Update Todos', true, 200)]
  items.forEach((item, i) => {
    const finished = i < done
    out.push(
      t(finished ? 'todo-done' : 'todo-open', `  ${i === 0 ? '└  ' : '   '}${finished ? '☒' : '☐'} ${item}`, false, 70),
    )
  })
  out.push(t('cont', '', false, 520))
  return out
}

function taskBlock(r: Rand): Emit[] {
  const agent = pick(r, SUBAGENTS)
  const goal = pick(r, TASKS)
  return [
    t('tool', `● Task(${agent}: ${goal})`, true, 900),
    t('gut', `  └  Done (${int(r, 6, 34)} tool uses · ${k(r, 8, 96)} tokens · ${int(r, 0, 4)}m ${int(r, 3, 59)}s)`, false, 520),
  ]
}

function webBlock(r: Rand): Emit[] {
  const q = pick(r, [
    'oxc oxlint rule severity config',
    'vite 8 environment api migration',
    'svelte 5 runes fine-grained reactivity',
    'structured concurrency backoff jitter',
  ])
  return [
    t('tool', `● WebSearch("${q}")`, true, 700),
    t('gut', `  └  Found ${int(r, 4, 14)} results`, false, 460),
  ]
}

function rustBlock(r: Rand): Emit[] {
  const tests = int(r, 38, 420)
  return [
    t('tool', '● Bash(cargo test --workspace --all-features)', true, 480),
    t('gut', `  └  Compiling kestrel-runtime v0.${int(r, 8, 29)}.0`, false, 90),
    t('cont', `     test result: ok. ${tests} passed; 0 failed; ${int(r, 2, 18)} ignored`, false, 520),
  ]
}

function pythonBlock(r: Rand): Emit[] {
  return [
    t('tool', '● Bash(uv run pytest -q --disable-warnings)', true, 420),
    t('gut', `  └  ${'·'.repeat(int(r, 18, 38))}  ${int(r, 84, 760)} passed`, false, 110),
    t('cont', `     coverage: ${int(r, 82, 99)}% · ${(r() * 8 + 1).toFixed(2)}s`, false, 480),
  ]
}

function infrastructureBlock(r: Rand): Emit[] {
  const change = int(r, 1, 7)
  return [
    t('tool', '● Bash(terraform plan -out=.tfplan)', true, 520),
    t('gut', `  └  Plan: ${change} to add, ${int(r, 1, 5)} to change, 0 to destroy.`, false, 180),
    t('ok', '     No forced replacements detected.', false, 500),
  ]
}

function databaseBlock(r: Rand): Emit[] {
  return [
    t('tool', '● Bash(psql -f db/explain/tenant_query.sql)', true, 460),
    t('gut', `  └  Index Scan using tenant_events_pkey  (actual time=${(r() + 0.1).toFixed(3)}..${(r() * 4 + 1).toFixed(3)} ms)`, false, 120),
    t('cont', `     Planning Time: ${(r() * 2).toFixed(3)} ms · Execution Time: ${(r() * 8 + 1).toFixed(3)} ms`, false, 500),
  ]
}

function browserBlock(r: Rand): Emit[] {
  const nodes = int(r, 36, 180)
  return [
    t('tool', '● Bash(pnpm exec playwright test --project=chromium)', true, 480),
    t('gut', `  └  ✓ keyboard navigation · ${nodes} accessibility nodes inspected`, false, 100),
    t('ok', `     ${int(r, 8, 42)} passed · 0 focus-order regressions`, false, 500),
  ]
}

function securityBlock(r: Rand): Emit[] {
  const needsReview = chance(r, 0.25)
  return [
    t('tool', '● Bash(trivy fs --severity HIGH,CRITICAL .)', true, 500),
    t('gut', `  └  ${int(r, 120, 940)} packages scanned · 0 secrets committed`, false, 100),
    t(needsReview ? 'err' : 'ok', needsReview ? '     HIGH  transitive package requires review' : '     0 high · 0 critical findings', false, 520),
  ]
}

function proseBlock(r: Rand): Emit[] {
  const s = pick(r, PROSE)
  return [t('text', s, true, 520), t('cont', '', false, 220)]
}

function hex(r: Rand, n: number) {
  let s = ''
  for (let i = 0; i < n; i++) s += '0123456789abcdef'[Math.floor(r() * 16)]
  return s
}

/* ----------------------------------------------------------------- weights */

type Maker = (r: Rand) => Emit[]
export type BlockFlavor = 'implementation' | 'research' | 'validation' | 'orchestration'

const DECK: Array<[Maker, number, BlockFlavor]> = [
  [readBlock, 20, 'research'],
  [editBlock, 20, 'implementation'],
  [bashBlock, 16, 'validation'],
  [grepBlock, 11, 'research'],
  [proseBlock, 9, 'orchestration'],
  [globBlock, 6, 'research'],
  [writeBlock, 6, 'implementation'],
  [taskBlock, 5, 'orchestration'],
  [webBlock, 3, 'research'],
  [rustBlock, 3, 'implementation'],
  [pythonBlock, 3, 'implementation'],
  [infrastructureBlock, 3, 'validation'],
  [databaseBlock, 3, 'validation'],
  [browserBlock, 3, 'validation'],
  [securityBlock, 2, 'validation'],
]

export function nextBlock(r: Rand, todoDone: number, flavor: BlockFlavor = 'implementation'): Emit[] {
  if (chance(r, flavor === 'orchestration' ? 0.2 : 0.07)) return todoBlock(r, todoDone)
  const weighted = DECK.map(([make, weight, category]) => [make, weight * (category === flavor ? 2.7 : 0.72)] as const)
  let n = r() * weighted.reduce((sum, [, weight]) => sum + weight, 0)
  for (const [make, weight] of weighted) {
    n -= weight
    if (n <= 0) return make(r)
  }
  return readBlock(r)
}

/** The opening request line of a fresh session. */
export function openingEmits(r: Rand, task: string): Emit[] {
  return [
    t('user', `› ${task}`, true, 620),
    t('cont', '', false, 120),
  ]
}

export function makePrompt(r: Rand): Prompt {
  if (chance(r, 0.5)) {
    const i = int(r, 0, BASH.length - 1)
    return {
      title: 'Bash command',
      body: [BASH[i] as string, BASH_DESC[i] as string],
      question: 'Do you want to proceed?',
      options: ['Yes', "Yes, and don't ask again for pnpm commands", 'No, and tell the agent what to do differently (esc)'],
    }
  }
  const p = path(r)
  return {
    title: 'Edit file',
    body: [p, `${int(r, 2, 14)} additions · ${int(r, 0, 6)} removals`],
    question: `Do you want to make this edit to ${p.split('/').pop()}?`,
    options: ['Yes', "Yes, allow all edits during this session (shift+tab)", 'No, and tell the agent what to do differently (esc)'],
  }
}
