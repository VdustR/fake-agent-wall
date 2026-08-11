import { AGENT_ROLES, BRANCHES, MODELS, REPOS, TASKS } from './corpus'
import { chance, int, mulberry32, pick, range, type Rand } from './rng'
import { makePrompt, nextBlock, openingEmits, type Emit, type Line, type Prompt } from './transcript'
import { SPINNER_VERBS } from './verbs'

export type Status = 'run' | 'cue' | 'hold' | 'done'

/** Ring size per panel. Enough scrollback to read, small enough to stay cheap. */
const KEEP = 60

export class Agent {
  readonly slot: number
  readonly label: string
  #r: Rand

  repo = $state('')
  branch = $state('')
  model = $state('')
  task = $state('')

  lines = $state.raw<Line[]>([])
  partial = $state<Line | null>(null)
  status = $state<Status>('cue')
  verb = $state('Thinking')
  prompt = $state<Prompt | null>(null)

  tokensUp = $state(0)
  tokensDown = $state(0)
  toolUses = $state(0)
  contextLeft = $state(100)
  /** 0..1 output pressure, drives the panel's activity meter. */
  level = $state(0)
  /** Peak-hold cap for that meter. Catches instantly, falls back slowly. */
  levelPeak = $state(0)
  sessionMs = $state(0)
  /** Never reset by a task turnover, so swarm-wide rates stay monotonic. */
  lifeTokens = $state(0)
  lifeTools = $state(0)
  /** Bumped on every committed tool bullet so the ticker can pick it up. */
  lastEvent = $state<{ n: number; text: string } | null>(null)

  #queue: Emit[] = []
  #chars = 0
  #speed = 0
  #waitUntil = 0
  #phaseUntil = 0
  #todoDone = 0
  #blocksLeft = 0
  #eventN = 0
  #verbUntil = 0
  /** When set, lines land whole instead of typing. Driven by prefers-reduced-motion. */
  calm = false

  constructor(slot: number, seed: number) {
    this.slot = slot
    this.#r = mulberry32(seed)
    this.label = `${pick(this.#r, AGENT_ROLES)}-${String(slot).padStart(2, '0')}`
    this.#newSession(0)
    // Every panel opens mid-flight. A wall of near-empty terminals reads as
    // "nothing is happening", which is the one thing this prop must never say.
    this.#prefill(int(this.#r, 7, 16))
  }

  get numLabel() {
    return String(this.slot).padStart(2, '0')
  }

  /** Commit whole blocks instantly to manufacture believable scrollback. */
  #prefill(blocks: number) {
    const out: Line[] = [...this.lines]
    for (const e of this.#queue) out.push(e.line)
    this.#queue = []
    this.partial = null

    for (let i = 0; i < blocks; i++) {
      for (const e of nextBlock(this.#r, this.#todoDone)) {
        out.push(e.line)
        if (e.line.k === 'tool') {
          this.toolUses += 1
          this.lifeTools += 1
          this.contextLeft = Math.max(9, this.contextLeft - range(this.#r, 0.3, 1.6))
        }
        const spent = Math.round(e.line.s.length * 1.1) + 4 + Math.round(range(this.#r, 0, 90))
        this.tokensDown += Math.round(e.line.s.length * 1.1) + 4
        this.tokensUp += Math.round(range(this.#r, 0, 90))
        this.lifeTokens += spent
      }
      this.#blocksLeft -= 1
      if (chance(this.#r, 0.3)) this.#todoDone = Math.min(6, this.#todoDone + 1)
    }

    this.lines = out.slice(-KEEP)
    this.status = 'cue'
    // Stagger the first turn so nine panels do not fire in lockstep.
    const t0 = performance.now()
    this.#pickVerb(t0)
    this.#phaseUntil = t0 + range(this.#r, 300, 4200)
  }

  #newSession(now: number) {
    const r = this.#r
    this.repo = pick(r, REPOS)
    this.branch = pick(r, BRANCHES)
    this.model = pick(r, MODELS)
    this.task = pick(r, TASKS)
    // Scrollback survives: the panel keeps reading as a long-lived session
    // instead of blinking empty every time a task turns over.
    this.lines = this.lines.length
      ? [...this.lines, { k: 'rule' as const, s: '' }].slice(-KEEP)
      : []
    this.partial = null
    this.prompt = null
    this.tokensUp = int(r, 800, 4200)
    this.tokensDown = 0
    this.toolUses = 0
    this.contextLeft = int(r, 78, 97)
    this.sessionMs = int(r, 0, 240_000)
    this.#todoDone = 0
    this.#blocksLeft = int(r, 14, 34)
    this.#queue = openingEmits(r, this.task)
    this.#beginLine()
    this.#waitUntil = now
    this.status = 'run'
  }

  #pickVerb(now: number) {
    this.verb = pick(this.#r, SPINNER_VERBS)
    this.#verbUntil = now + range(this.#r, 1400, 3600)
  }

  #beginLine() {
    const e = this.#queue[0]
    if (!e) {
      this.partial = null
      return
    }
    this.#chars = e.type ? 0 : e.line.s.length
    this.#speed = range(this.#r, 260, 620)
    this.partial = e.type ? { k: e.line.k, s: '' } : { ...e.line }
  }

  #commit(now: number) {
    const e = this.#queue.shift()
    if (!e) return
    this.lines = [...this.lines, e.line].slice(-KEEP)
    this.partial = null
    this.#waitUntil = now + e.pause

    if (e.line.k === 'tool') {
      this.toolUses += 1
      this.lifeTools += 1
      this.#eventN += 1
      this.lastEvent = { n: this.#eventN, text: e.line.s.replace(/^⏺ /, '') }
      this.contextLeft = Math.max(6, this.contextLeft - range(this.#r, 0.3, 1.6))
    }
    const down = Math.round(e.line.s.length * range(this.#r, 0.6, 1.4)) + 4
    const up = Math.round(range(this.#r, 0, 90))
    this.tokensDown += down
    this.tokensUp += up
    this.lifeTokens += down + up

    if (this.#queue.length) this.#beginLine()
  }

  #afterBlock(now: number) {
    const r = this.#r
    this.#blocksLeft -= 1

    if (this.#blocksLeft <= 0) {
      this.status = 'done'
      this.#phaseUntil = now + range(r, 4200, 9000)
      this.lines = [
        ...this.lines,
        { k: 'cont' as const, s: '' },
        {
          k: 'ok' as const,
          s: `⏺ Done — ${this.toolUses} tool uses · ${((this.tokensUp + this.tokensDown) / 1000).toFixed(1)}k tokens`,
        },
      ].slice(-KEEP)
      return
    }

    if (chance(r, 0.08)) {
      this.status = 'hold'
      this.prompt = makePrompt(r)
      this.#phaseUntil = now + range(r, 3600, 7600)
      return
    }

    this.status = 'cue'
    this.#pickVerb(now)
    this.#phaseUntil = now + range(r, 600, 2400)
  }

  tick(now: number, dt: number) {
    this.sessionMs += dt
    this.level += -this.level * Math.min(1, dt / 700)
    this.levelPeak = Math.max(this.level, this.levelPeak - this.levelPeak * (dt / 2600))

    if (this.status === 'done') {
      if (now >= this.#phaseUntil) this.#newSession(now)
      return
    }

    if (this.status === 'hold') {
      if (now >= this.#phaseUntil) {
        this.prompt = null
        this.lines = [
          ...this.lines,
          { k: 'dim' as const, s: '  ⎿  Approved · continuing' },
          { k: 'cont' as const, s: '' },
        ].slice(-KEEP)
        this.status = 'cue'
        this.#pickVerb(now)
        this.#phaseUntil = now + range(this.#r, 500, 1400)
      }
      return
    }

    if (this.status === 'cue') {
      if (now >= this.#verbUntil) this.#pickVerb(now)
      if (now >= this.#phaseUntil) {
        this.#queue = nextBlock(this.#r, this.#todoDone)
        if (chance(this.#r, 0.3)) this.#todoDone = Math.min(6, this.#todoDone + 1)
        this.status = 'run'
        this.#beginLine()
      }
      return
    }

    // status === 'run'
    if (now < this.#waitUntil) {
      if (!this.#queue.length) this.#afterBlock(now)
      return
    }

    const head = this.#queue[0]
    if (!head) {
      this.#afterBlock(now)
      return
    }

    if (this.calm) {
      this.#chars = head.line.s.length
      this.partial = { ...head.line }
      this.#commit(now)
      // Whole lines at a reading pace. Without this floor the short inter-line
      // pauses would land twenty lines a second, which is more motion, not less.
      this.#waitUntil = Math.max(this.#waitUntil, now + 520)
      this.level = Math.min(1, this.level + 0.25)
      return
    }

    if (this.#chars < head.line.s.length) {
      this.#chars = Math.min(head.line.s.length, this.#chars + (this.#speed * dt) / 1000)
      const cut = Math.floor(this.#chars)
      if (this.partial) this.partial = { k: head.line.k, s: head.line.s.slice(0, cut) }
      this.level = Math.min(1, this.level + dt / 260)
      return
    }

    this.#commit(now)
    this.level = Math.min(1, this.level + 0.25)
  }
}
