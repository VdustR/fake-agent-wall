/**
 * Fabricates Claude Code transcript blocks.
 *
 * The DATA is invented. The GRAMMAR is copied from the real client: the `⏺`
 * tool bullet, the `⎿` result gutter, right-aligned diff line numbers, the
 * `☒/☐` todo glyphs, and the `(N tool uses · Nk tokens · Nm Ns)` subagent
 * summary. Fidelity of format is the whole point of the prop.
 */
import {
  BASH,
  BASH_DESC,
  CODE_ADD,
  CODE_CTX,
  CODE_DEL,
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
    t('tool', `⏺ Read(${p})`, true, 260),
    t('gut', `  ⎿  Read ${int(r, 24, 486)} lines`, false, 420),
  ]
}

function grepBlock(r: Rand): Emit[] {
  const pat = pick(r, SYMBOLS).replace('(', '\\(')
  const dir = pick(r, DIRS).split('/')[0] as string
  const hits = int(r, 3, 47)
  return [
    t('tool', `⏺ Grep(pattern: "${pat}", path: "${dir}")`, true, 300),
    t('gut', `  ⎿  Found ${hits} file${hits === 1 ? '' : 's'}`, false, 380),
  ]
}

function globBlock(r: Rand): Emit[] {
  const dir = pick(r, DIRS)
  return [
    t('tool', `⏺ Glob(${dir}/**/*.ts)`, true, 240),
    t('gut', `  ⎿  ${int(r, 6, 92)} paths`, false, 340),
  ]
}

function bashBlock(r: Rand): Emit[] {
  const i = int(r, 0, BASH.length - 1)
  const cmd = BASH[i] as string
  const out: Emit[] = [t('tool', `⏺ Bash(${cmd})`, true, 340)]

  if (cmd.startsWith('pnpm vitest')) {
    const files = int(r, 2, 6)
    const tests = int(r, 18, 240)
    const failing = chance(r, 0.22)
    out.push(t('gut', `  ⎿  ${'·'.repeat(int(r, 14, 34))}`, false, 260))
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
    out.push(t('gut', `  ⎿  Finished in ${int(r, 31, 240)}ms on ${int(r, 180, 2400)} files with 96 rules using ${int(r, 8, 14)} threads.`, false, 90))
    out.push(t('ok', `     Found 0 warnings and 0 errors.`, false, 480))
    return out
  }

  if (cmd.startsWith('pnpm tsc')) {
    if (chance(r, 0.3)) {
      out.push(t('gut', `  ⎿  ${path(r)}(${int(r, 12, 300)},${int(r, 3, 60)}): ${pick(r, ERRORS)}`, false, 120))
      out.push(t('err', `     Found 1 error in 1 file.`, false, 460))
    } else {
      out.push(t('gut', `  ⎿  (no output)`, false, 420))
    }
    return out
  }

  if (cmd.startsWith('git log')) {
    for (let n = 0; n < 5; n++) {
      out.push(
        t(n === 0 ? 'gut' : 'cont', `${n === 0 ? '  ⎿  ' : '     '}${hex(r, 7)} ${pick(r, TASKS)}`, false, 55),
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
        t(n === 0 ? 'gut' : 'cont', `${n === 0 ? '  ⎿  ' : '     '}${path(r)} | ${add + del} ${'+'.repeat(Math.min(add, 12))}${'-'.repeat(Math.min(del, 6))}`, false, 60),
      )
    }
    out.push(t('cont', `     ${files} files changed`, false, 400))
    return out
  }

  if (cmd.startsWith('pnpm bench')) {
    out.push(t('gut', `  ⎿  queue.push        ${int(r, 180, 900)} ops/s   ±${(r() * 3).toFixed(2)}%`, false, 80))
    out.push(t('cont', `     queue.flush       ${int(r, 40, 300)} ops/s   ±${(r() * 3).toFixed(2)}%`, false, 80))
    out.push(t('cont', `     policy.next    ${int(r, 4000, 90000)} ops/s   ±${(r() * 2).toFixed(2)}%`, false, 460))
    return out
  }

  out.push(t('gut', `  ⎿  ${pick(r, BASH_DESC)} — ok (${int(r, 40, 3200)}ms)`, false, 420))
  return out
}

function editBlock(r: Rand): Emit[] {
  const p = path(r)
  const adds = int(r, 2, 18)
  const dels = int(r, 0, 9)
  const start = int(r, 12, 320)
  const out: Emit[] = [
    t('tool', `⏺ Update(${p})`, true, 300),
    t('gut', `  ⎿  Updated ${p} with ${adds} addition${adds === 1 ? '' : 's'} and ${dels} removal${dels === 1 ? '' : 's'}`, false, 200),
  ]
  let ln = start
  out.push(t('ctx', `    ${num(ln++)}    ${pick(r, CODE_CTX)}`, false, 45))
  const hunks = int(r, 1, 3)
  for (let h = 0; h < hunks; h++) {
    if (chance(r, 0.75)) out.push(t('del', `    ${num(ln)} -  ${pick(r, CODE_DEL)}`, false, 55))
    out.push(t('add', `    ${num(ln++)} +  ${pick(r, CODE_ADD)}`, false, 55))
    if (chance(r, 0.5)) out.push(t('add', `    ${num(ln++)} +  ${pick(r, CODE_CTX)}`, false, 55))
    out.push(t('ctx', `    ${num(ln++)}    ${pick(r, CODE_CTX)}`, false, 45))
  }
  out.push(t('cont', '', false, 480))
  return out
}

function writeBlock(r: Rand): Emit[] {
  const p = path(r)
  return [
    t('tool', `⏺ Write(${p})`, true, 320),
    t('gut', `  ⎿  Wrote ${int(r, 18, 260)} lines to ${p}`, false, 460),
  ]
}

function todoBlock(r: Rand, done: number): Emit[] {
  const items = sample(r, TODOS, int(r, 4, 6))
  const out: Emit[] = [t('tool', '⏺ Update Todos', true, 200)]
  items.forEach((item, i) => {
    const finished = i < done
    out.push(
      t(finished ? 'todo-done' : 'todo-open', `  ${i === 0 ? '⎿  ' : '   '}${finished ? '☒' : '☐'} ${item}`, false, 70),
    )
  })
  out.push(t('cont', '', false, 520))
  return out
}

function taskBlock(r: Rand): Emit[] {
  const agent = pick(r, SUBAGENTS)
  const goal = pick(r, TASKS)
  return [
    t('tool', `⏺ Task(${agent}: ${goal})`, true, 900),
    t('gut', `  ⎿  Done (${int(r, 6, 34)} tool uses · ${k(r, 8, 96)} tokens · ${int(r, 0, 4)}m ${int(r, 3, 59)}s)`, false, 520),
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
    t('tool', `⏺ WebSearch("${q}")`, true, 700),
    t('gut', `  ⎿  Found ${int(r, 4, 14)} results`, false, 460),
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

const DECK: Array<[Maker, number]> = [
  [readBlock, 20],
  [editBlock, 20],
  [bashBlock, 16],
  [grepBlock, 11],
  [proseBlock, 9],
  [globBlock, 6],
  [writeBlock, 6],
  [taskBlock, 5],
  [webBlock, 3],
]

const TOTAL = DECK.reduce((a, [, w]) => a + w, 0)

export function nextBlock(r: Rand, todoDone: number): Emit[] {
  if (chance(r, 0.09)) return todoBlock(r, todoDone)
  let n = r() * TOTAL
  for (const [make, w] of DECK) {
    n -= w
    if (n <= 0) return make(r)
  }
  return readBlock(r)
}

/** The opening `>` line of a fresh session. */
export function openingEmits(r: Rand, task: string): Emit[] {
  return [
    t('user', `> ${task}`, true, 620),
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
      options: ['Yes', "Yes, and don't ask again for pnpm commands", 'No, and tell Claude what to do differently (esc)'],
    }
  }
  const p = path(r)
  return {
    title: 'Edit file',
    body: [p, `${int(r, 2, 14)} additions · ${int(r, 0, 6)} removals`],
    question: `Do you want to make this edit to ${p.split('/').pop()}?`,
    options: ['Yes', "Yes, allow all edits during this session (shift+tab)", 'No, and tell Claude what to do differently (esc)'],
  }
}
