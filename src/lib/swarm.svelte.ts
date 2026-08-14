import { Agent } from './agent.svelte'

export interface TickerItem {
  id: number
  slot: string
  repo: string
  text: string
  clock: string
}

// Start dense enough for ordinary screens. Large walls extend the synthetic
// fleet on demand so card size, rather than a fixed source count, limits density.
const INITIAL_AGENT_COUNT = 26
const CUT_MIN = 9_500
const CUT_MAX = 15_000
/** How long the incoming source sits in preview before the cut. */
const CUE_LEAD = 900
const HISTORY = 90

const pad = (n: number, w = 2) => String(Math.floor(n)).padStart(w, '0')

export class Swarm {
  agents = $state.raw<Agent[]>([])
  readonly #seed: number

  pgm = $state(0)
  /** Slot index queued for the next cut, or -1 when nothing is cued. */
  pst = $state(-1)
  /** Frames remaining on the cut flash. */
  flash = $state(0)

  ticker = $state.raw<TickerItem[]>([])
  running = $state(0)
  tokensPerMin = $state(0)
  toolsPerMin = $state(0)
  /** Peak-hold caps for the bus meters. They decay; they never jump backwards. */
  peakTokens = $state(0)
  peakTools = $state(0)
  /** Milliseconds until the next program cut, for the countdown on the monitor. */
  nextCutIn = $state(0)
  totalTokens = $state(0)
  totalTools = $state(0)
  uptimeMs = $state(0)
  reducedMotion = $state(false)
  /** Rolling throughput history, newest last, 0..1 normalised. */
  history = $state.raw<number[]>(
    // Seeded so the chart opens with a plausible trace instead of an empty well.
    Array.from({ length: HISTORY }, (_, i) => 0.28 + 0.34 * Math.abs(Math.sin(i * 0.7)) + 0.16 * Math.abs(Math.sin(i * 0.19))),
  )

  #cutAt = 0
  #cueAt = 0
  #lastSeen = new Map<number, number>()
  #tickerId = 0
  #raf = 0
  #watchdog = 0
  #prev = 0
  #histAcc = 0
  #tokenWindow: Array<[number, number]> = []
  #toolWindow: Array<[number, number]> = []
  #startOffset = 0
  #visibleSlots = new Set<number>()
  #backgroundAcc = 0
  #mediaQuery: MediaQueryList | null = null
  #mediaListener: ((event: MediaQueryListEvent) => void) | null = null

  constructor(seed = 20260811) {
    this.#seed = seed
    this.ensureAgentCount(INITIAL_AGENT_COUNT)
    this.#startOffset = 3_000_000 + seed % 900_000
  }

  ensureAgentCount(count: number): void {
    if (count <= this.agents.length) return
    const additions = Array.from(
      { length: count - this.agents.length },
      (_, index) => {
        const slot = this.agents.length + index + 1
        return new Agent(slot, this.#seed + (slot - 1) * 7919)
      },
    )
    this.agents = [...this.agents, ...additions]
  }

  setAgentCount(count: number): void {
    const target = Math.max(INITIAL_AGENT_COUNT, count)
    if (target >= this.agents.length) {
      this.ensureAgentCount(target)
      return
    }
    this.agents = this.agents.slice(0, target)
    if (this.pgm >= target) this.pgm = 0
    if (this.pst >= target) this.pst = -1
  }

  /** SMPTE-style running clock for the rail. Fabricated, like everything else. */
  get timecode() {
    const ms = this.#startOffset + this.uptimeMs
    const f = Math.floor((ms % 1000) / 40)
    const s = Math.floor(ms / 1000) % 60
    const m = Math.floor(ms / 60_000) % 60
    const h = Math.floor(ms / 3_600_000) % 24
    return `${pad(h)}:${pad(m)}:${pad(s)}:${pad(f)}`
  }

  start() {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    this.reducedMotion = mq.matches
    this.#mediaQuery = mq
    this.#mediaListener = event => (this.reducedMotion = event.matches)
    mq.addEventListener('change', this.#mediaListener)

    this.#prev = performance.now()
    this.#cueAt = this.#prev + 6000
    const loop = (now: number) => {
      this.#step(now)
      this.#raf = requestAnimationFrame(loop)
    }
    this.#raf = requestAnimationFrame(loop)

    // Browsers park requestAnimationFrame whenever the page is not the visible
    // tab. A prop left on a second screen, or behind another window, would
    // otherwise freeze mid-line. This keeps the wall advancing regardless, and
    // costs nothing while rAF is healthy.
    this.#watchdog = window.setInterval(() => {
      const now = performance.now()
      if (now - this.#prev < 400) return
      // Catch up in bounded slices, and never past the real clock: a simulation
      // that outruns `now` inflates every per-minute readout on the wall.
      let guard = 0
      while (this.#prev < now - 60 && guard++ < 20) this.#step(Math.min(now, this.#prev + 100))
      // Anything longer than that slice budget is skipped, not simulated.
      this.#prev = now
    }, 250)
  }

  #step(now: number) {
    const dt = Math.min(120, Math.max(0, now - this.#prev))
    this.#prev = now
    this.frame(now, dt)
  }

  stop() {
    cancelAnimationFrame(this.#raf)
    clearInterval(this.#watchdog)
    if (this.#mediaQuery && this.#mediaListener) this.#mediaQuery.removeEventListener('change', this.#mediaListener)
    this.#mediaQuery = null
    this.#mediaListener = null
  }

  setVisibleSlots(slots: number[]) {
    this.#visibleSlots = new Set(slots)
  }

  frame(now: number, dt: number) {
    this.uptimeMs += dt
    this.#backgroundAcc += dt
    const tickBackground = this.#backgroundAcc >= 250
    const backgroundDt = this.#backgroundAcc
    if (tickBackground) this.#backgroundAcc = 0

    let running = 0
    let tokens = 0
    let tools = 0
    for (const a of this.agents) {
      a.calm = this.reducedMotion
      if (this.#visibleSlots.has(a.slot)) a.tick(now, dt)
      else if (tickBackground) a.tick(now, backgroundDt)
      if (a.status !== 'done') running += 1
      tokens += a.lifeTokens
      tools += a.lifeTools
      const seen = this.#lastSeen.get(a.slot) ?? 0
      const ev = a.lastEvent
      if (ev && ev.n > seen) {
        this.#lastSeen.set(a.slot, ev.n)
        this.#pushTicker(a)
      }
    }
    this.running = running
    this.totalTokens = tokens
    this.totalTools = tools

    this.#tokenWindow.push([now, tokens])
    this.#toolWindow.push([now, tools])
    const cutoff = now - 8000
    while (this.#tokenWindow.length > 2 && (this.#tokenWindow[0] as [number, number])[0] < cutoff) this.#tokenWindow.shift()
    while (this.#toolWindow.length > 2 && (this.#toolWindow[0] as [number, number])[0] < cutoff) this.#toolWindow.shift()
    // Low-pass the rates. The raw quotient jumps whenever the frame clock does
    // (a throttled tab catching up), and a readout that flickers on camera is
    // worse than one that lags a second behind the truth.
    const smooth = Math.min(1, dt / 900)
    this.tokensPerMin += (rate(this.#tokenWindow) * 60_000 - this.tokensPerMin) * smooth
    this.toolsPerMin += (rate(this.#toolWindow) * 60_000 - this.toolsPerMin) * smooth

    // Peak hold: catch instantly, fall back over about four seconds.
    const fall = dt / 4000
    this.peakTokens = Math.max(this.tokensPerMin, this.peakTokens - this.peakTokens * fall)
    this.peakTools = Math.max(this.toolsPerMin, this.peakTools - this.peakTools * fall)

    this.#histAcc += dt
    if (this.#histAcc > 130) {
      this.#histAcc = 0
      const lvl = this.agents.reduce((a, x) => a + x.level, 0) / this.agents.length
      this.history = [...this.history.slice(1), Math.min(1, 0.14 + lvl * 1.5)]
    }

    if (this.flash > 0) this.flash = Math.max(0, this.flash - dt)

    if (this.reducedMotion) {
      this.nextCutIn = 0
      return
    }

    this.nextCutIn = Math.max(0, (this.pst === -1 ? this.#cueAt : this.#cutAt) - now)

    if (this.pst === -1 && now >= this.#cueAt) {
      this.pst = this.#chooseNext()
      this.#cutAt = now + CUE_LEAD
    } else if (this.pst !== -1 && now >= this.#cutAt) {
      this.pgm = this.pst
      this.pst = -1
      this.flash = 190
      this.#cueAt = now + CUT_MIN + Math.random() * (CUT_MAX - CUT_MIN)
    }
  }

  #chooseNext() {
    const hot = this.agents
      .map((a, i) => [i, a] as const)
      .filter(([i, a]) => i !== this.pgm && a.status !== 'done')
    const pool = hot.length ? hot : this.agents.map((a, i) => [i, a] as const).filter(([i]) => i !== this.pgm)
    const held = pool.filter(([, a]) => a.status === 'hold')
    const from = held.length && Math.random() < 0.45 ? held : pool
    return (from[Math.floor(Math.random() * from.length)] as readonly [number, Agent])[0]
  }

  #pushTicker(a: Agent) {
    const ev = a.lastEvent
    if (!ev) return
    const item: TickerItem = {
      id: this.#tickerId++,
      slot: a.numLabel,
      repo: a.repo,
      text: ev.text,
      clock: this.timecode.slice(0, 8),
    }
    this.ticker = [item, ...this.ticker].slice(0, 26)
  }
}

function rate(w: Array<[number, number]>) {
  if (w.length < 2) return 0
  const a = w[0] as [number, number]
  const b = w[w.length - 1] as [number, number]
  const dt = b[0] - a[0]
  return dt > 0 ? (b[1] - a[1]) / dt : 0
}
