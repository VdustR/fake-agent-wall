import type { Swarm } from './swarm.svelte'
import { packMosaic, targetViewportCapacity, viewportCapacityMetric, violationsFor, type GridRect, type MosaicItem } from './mosaic-layout'

export type OpsCardId = 'board' | 'pulls' | 'contributions' | 'usage' | 'cost' | 'resets' | 'release' | 'fleet'

export interface OpsNotice {
  eyebrow: string
  title: string
  detail: string
  tone: 'coral' | 'green' | 'amber' | 'blue'
}

export const ISSUE_COLUMNS = [
  {
    label: 'Backlog',
    count: 14,
    items: [
      ['#842', 'Bound retry jitter at the tenant edge', 'P1', 'atlas-gateway'],
      ['#817', 'Stream large diffs off the main thread', 'P2', 'lantern-ui'],
      ['#799', 'Write rollback notes for session v3', 'P2', 'mesa-identity'],
      ['#768', 'Document the cache invalidation contract', 'P3', 'kestrel-runtime'],
    ],
  },
  {
    label: 'Ready',
    count: 7,
    items: [
      ['#851', 'Remove the legacy webhook cursor', 'P1', 'foxglove-api'],
      ['#826', 'Cap the ingest queue by tenant', 'P1', 'harbor-ingest'],
      ['#774', 'Move token budget into policy', 'P3', 'kestrel-runtime'],
      ['#759', 'Add a canary gate to stable deploys', 'P2', 'cinder-worker'],
    ],
  },
  {
    label: 'In progress',
    count: 9,
    items: [
      ['#863', 'Make replay idempotent across retries', 'P0', 'quarry-etl'],
      ['#838', 'Replace the fake clock in resume tests', 'P1', 'sable-scheduler'],
      ['#812', 'Reconcile generated OpenAPI clients', 'P2', 'driftwood-cli'],
      ['#806', 'Trace cold-start allocations by phase', 'P2', 'quarry-etl'],
    ],
  },
  {
    label: 'Review',
    count: 5,
    items: [
      ['#871', 'Drain workers before key rotation', 'P0', 'cinder-worker'],
      ['#845', 'Adopt organization issue fields', 'P2', 'tessera-design'],
      ['#833', 'Verify keyboard focus after route swaps', 'P1', 'orbit-web'],
    ],
  },
] as const

export const PULLS = [
  { id: '#1284', title: 'Make webhook replay idempotent', repo: 'foxglove-api', state: '2 approvals', checks: '18/18', delta: '+184 −61' },
  { id: '#903', title: 'Bound the tenant ingest queue', repo: 'harbor-ingest', state: 'changes requested', checks: '16/17', delta: '+92 −44' },
  { id: '#441', title: 'Move diff rendering to a worker', repo: 'lantern-ui', state: 'ready to merge', checks: '24/24', delta: '+307 −198' },
  { id: '#772', title: 'Write the reversible down migration', repo: 'mesa-identity', state: 'review pending', checks: '11/11', delta: '+68 −12' },
] as const

export const PROVIDERS = [
  { name: 'Anthropic', model: 'opus', used: 78, resetSeconds: 6_138, tokens: 4.82, cost: 38.14 },
  { name: 'OpenAI', model: 'gpt-5.6-sol', used: 61, resetSeconds: 31_847, tokens: 3.17, cost: 27.68 },
  { name: 'Google', model: 'gemini-3.7-flash', used: 44, resetSeconds: 1_062, tokens: 2.91, cost: 16.03 },
  { name: 'Alibaba', model: 'qwen3.7-max', used: 86, resetSeconds: 18_420, tokens: 5.44, cost: 21.72 },
  { name: 'DeepSeek', model: 'deepseek-v4-pro', used: 37, resetSeconds: 42_955, tokens: 1.86, cost: 8.95 },
  { name: 'Mistral', model: 'mistral-large-3', used: 52, resetSeconds: 12_704, tokens: 2.24, cost: 11.48 },
  { name: 'Moonshot', model: 'kimi-k2.5', used: 29, resetSeconds: 25_190, tokens: 1.42, cost: 6.37 },
  { name: 'Zhipu', model: 'glm-5-air', used: 68, resetSeconds: 8_611, tokens: 3.83, cost: 13.92 },
] as const

const CARD_CYCLES: OpsCardId[][] = [
  ['board', 'fleet', 'cost', 'release'],
  ['usage', 'pulls', 'contributions', 'fleet'],
  ['resets', 'release', 'board', 'usage'],
  ['fleet', 'pulls', 'cost', 'contributions'],
  ['contributions', 'release', 'usage', 'fleet'],
  ['pulls', 'board', 'resets', 'cost'],
  ['cost', 'fleet', 'release', 'usage'],
  ['release', 'contributions', 'board', 'resets'],
]

const TASKS = [
  ['#842', 'Bound retry jitter at the tenant edge'],
  ['#863', 'Make replay idempotent across retries'],
  ['#871', 'Drain workers before key rotation'],
  ['#441', 'Move diff rendering to a worker'],
  ['#903', 'Cap the ingest queue by tenant'],
  ['v0.5.0', 'Promote signed artifacts to stable'],
  ['#919', 'Preserve trace context across handoff'],
  ['#927', 'Coalesce duplicate invalidation events'],
  ['#934', 'Expose queue pressure to the scheduler'],
  ['#946', 'Verify recovery after a partial deploy'],
  ['#951', 'Bound artifact retention by channel'],
  ['#968', 'Move permission checks to the edge'],
  ['#977', 'Stream partial tool results to observers'],
  ['#982', 'Rebuild the release manifest atomically'],
  ['#991', 'Retry signed uploads by digest'],
  ['#1004', 'Split provider budgets by workload'],
  ['#1012', 'Add bounded jitter to lease renewal'],
  ['#1027', 'Verify resumable sessions after failover'],
  ['#1031', 'Compact stale traces in the hot partition'],
  ['#1048', 'Gate schema promotion on replay checks'],
  ['#1053', 'Surface decoder pressure in telemetry'],
  ['#1066', 'Reconcile regional quota snapshots'],
  ['#1074', 'Move artifact verification off-thread'],
  ['#1089', 'Preserve tool ordering across reconnects'],
] as const

const PHASES = ['queued', 'running', 'fixing', 'reviewing', 'merging'] as const

const CARD_ASPECT: Record<OpsCardId, number> = {
  contributions: 3.2,
  board: 0.78,
  pulls: 0.82,
  release: 0.86,
  cost: 1.1,
  usage: 0.72,
  resets: 0.68,
  fleet: 0.7,
}

const CARD_ASPECT_RANGE: Record<OpsCardId, readonly [number, number]> = {
  contributions: [2.2, 6],
  board: [0.55, 1.45],
  pulls: [0.55, 1.45],
  release: [0.55, 1.45],
  cost: [0.75, 2],
  usage: [0.55, 1.5],
  resets: [0.5, 1.35],
  fleet: [0.5, 1.35],
}

interface GridItem extends MosaicItem {
  type: 'pgm' | 'telemetry' | 'agent' | 'ops'
  key: string
  preferredAspect: number
  minAspect: number
  maxAspect: number
  weight: number
  minWidth: number
  minHeight: number
  agent?: Swarm['agents'][number]
  kind?: OpsCardId
}

const NOTICES: OpsNotice[] = [
  { eyebrow: 'Provider router · quota window', title: 'Primary capacity restored', detail: '9 sessions returned to nominal routing · next window 14:00', tone: 'coral' },
  { eyebrow: 'Release train · v0.5.0', title: 'Candidate promoted to stable', detail: 'macOS arm64 verified · Windows signing queued', tone: 'green' },
  { eyebrow: 'OpenAI · weekly window', title: 'Usage crossed 80%', detail: 'Cost router moved 3 background agents to the economy pool', tone: 'amber' },
  { eyebrow: 'Merge queue · lantern-ui', title: 'All required checks passed', detail: 'PR #441 will merge after the protected queue clears', tone: 'blue' },
]

export class OperationsWorld {
  epoch = $state(0)
  layoutEpoch = $state(0)
  telemetryTick = $state(0)
  notice = $state<OpsNotice | null>(null)
  scenario = $state('Release train · reliability week')
  viewportWidth = $state(900)
  viewportHeight = $state(700)
  slotCapacity = $state(4)

  #layoutTimer = 0
  #sceneTimer = 0
  #telemetryTimer = 0
  #noticeTimer = 0
  #noticeClear = 0
  #firstNotice = 0
  #placementCacheKey = ''
  #placementCache = new Map<string, GridRect>()
  #itemCache: GridItem[] = []
  #layoutViolations: string[] = []
  #hasViewport = false

  constructor(readonly swarm: Swarm) {}

  get slotCount(): number {
    return this.slotCapacity
  }

  #activeCardsFor(capacity: number): OpsCardId[] {
    const count = capacity <= 3 ? 0 : Math.max(1, Math.min(8, Math.floor(capacity / 6)))
    const cycle = CARD_CYCLES[this.layoutEpoch % CARD_CYCLES.length] as OpsCardId[]
    const allKinds = [...cycle, ...Object.keys(CARD_ASPECT).filter(kind => !cycle.includes(kind as OpsCardId)) as OpsCardId[]]
    return allKinds.slice(0, count)
  }

  get gridItems(): GridItem[] {
    this.#ensureLayout()
    return this.#itemCache
  }

  #buildGridItems(capacity: number): GridItem[] {
    const activeCards = this.#activeCardsFor(capacity)
    const terminalCount = Math.max(1, capacity - activeCards.length - 2)
    const offset = this.layoutEpoch % this.swarm.agents.length
    const agents = Array.from({ length: terminalCount }, (_, index) => this.swarm.agents[(offset + index) % this.swarm.agents.length]!)
      .map(agent => ({
        type: 'agent' as const,
        key: `agent-${agent.slot}`,
        preferredAspect: 1.35,
        preferredWidth: 360,
        preferredHeight: 230,
        minAspect: 0.75,
        maxAspect: 2.2,
        weight: 1,
        minWidth: 300,
        minHeight: 150,
        variants: [
          { minWidth: 300, minHeight: 150, minAspect: 0.75, maxAspect: 2.2 },
          { minWidth: 300, minHeight: 150, minAspect: 0.55, maxAspect: 3.5 },
        ],
        agent,
      }))
    const cards = activeCards.map(kind => ({
      type: 'ops' as const,
      key: `ops-${kind}`,
      preferredAspect: CARD_ASPECT[kind],
      minAspect: CARD_ASPECT_RANGE[kind][0],
      maxAspect: CARD_ASPECT_RANGE[kind][1],
      weight: kind === 'contributions' ? 1.5 : 1.1,
      preferredWidth: kind === 'contributions' ? 720 : 320,
      preferredHeight: kind === 'contributions' ? 220 : 280,
      minWidth: 150,
      minHeight: 120,
      kind,
    }))
    const items: GridItem[] = [
      { type: 'pgm', key: 'pgm', preferredAspect: 1.38, preferredWidth: 920, preferredHeight: 660, minAspect: 1.05, maxAspect: 2, weight: 5.5, minWidth: 320, minHeight: 240 },
      {
        type: 'telemetry',
        key: 'telemetry',
        preferredAspect: 3.2,
        preferredWidth: 760,
        preferredHeight: 260,
        minAspect: 2.4,
        maxAspect: 5,
        weight: 2.2,
        minWidth: 300,
        minHeight: 145,
        variants: [
          { minWidth: 520, minHeight: 330, minAspect: 1.6, maxAspect: 5 },
          { minWidth: 520, minHeight: 145, minAspect: 2.4, maxAspect: 6 },
          { minWidth: 300, minHeight: 220, minAspect: 0.65, maxAspect: 1.8 },
          { minWidth: 300, minHeight: 145, minAspect: 1.8, maxAspect: 6 },
        ],
      },
      ...agents.slice(0, Math.min(2, agents.length)),
    ]
    const remainingAgents = agents.slice(2)
    const agentsPerCard = cards.length ? Math.ceil(agents.length / cards.length) : 0
    cards.forEach((card, index) => {
      items.push(card)
      items.push(...remainingAgents.slice(index * agentsPerCard, (index + 1) * agentsPerCard))
    })
    const placedAgents = new Set(items.flatMap(item => item.agent ? [item.agent.slot] : []))
    items.push(...remainingAgents.filter(agent => !placedAgents.has(agent.agent!.slot)))
    return items
  }

  placementFor(key: string): string {
    this.#ensureLayout()
    const rect = this.#placementCache.get(key)
    return rect ? `${rect.row + 1} / ${rect.column + 1} / span ${rect.rows} / span ${rect.columns}` : 'auto'
  }

  get layoutViolations(): readonly string[] {
    this.#ensureLayout()
    return this.#layoutViolations
  }

  #ensureLayout(): void {
    const cacheKey = `${this.layoutEpoch}:${this.slotCapacity}:${this.viewportWidth}:${this.viewportHeight}`
    if (cacheKey === this.#placementCacheKey) return
    this.#placementCacheKey = cacheKey

    for (let capacity = this.slotCapacity; capacity >= 3; capacity -= 1) {
      const items = this.#buildGridItems(capacity)
      const packed = packMosaic(items, this.viewportWidth, this.viewportHeight)
      const violations = violationsFor(items, packed.rects, this.viewportWidth, this.viewportHeight)
      this.#itemCache = items
      this.#placementCache = packed.rects
      this.#layoutViolations = violations
      if (packed.feasible && violations.length === 0) return
    }
  }

  setViewport(width: number, height: number): void {
    this.viewportWidth = Math.round(width)
    this.viewportHeight = Math.round(height)
    const capacityMetric = viewportCapacityMetric(this.viewportWidth, this.viewportHeight)
    const target = targetViewportCapacity(this.viewportWidth, this.viewportHeight)
    this.swarm.setAgentCount(target)
    if (!this.#hasViewport) {
      this.slotCapacity = target
      this.#hasViewport = true
    } else if (target > this.slotCapacity && capacityMetric >= (this.slotCapacity + 1) * 1.06) {
      this.slotCapacity = target
    } else if (target < this.slotCapacity && capacityMetric <= this.slotCapacity * 0.94) {
      this.slotCapacity = target
    }
  }

  get activeAgent(): string { return this.swarm.agents[(this.epoch * 3 + 2) % this.swarm.agents.length]?.label ?? 'agent' }

  get fleetAgents() {
    const offset = this.epoch % this.swarm.agents.length
    return Array.from({ length: this.swarm.agents.length }, (_, index) => this.swarm.agents[(offset + index) % this.swarm.agents.length]!)
  }

  get contributions(): number[] {
    return Array.from({ length: 26 * 7 }, (_, index) => {
      let seed = (index + 1) * 2654435761 ^ (this.epoch >> 1) * 1013904223
      seed ^= seed << 13; seed ^= seed >>> 17; seed ^= seed << 5
      const random = (seed >>> 0) / 4294967295
      const weekday = index % 7
      const recent = Math.floor(index / 7) > 19 ? 0.18 : 0
      // An AI-builder wall represents continuous automated work across every
      // day and timezone. Empty days are exceptional, including weekends.
      if (random < (weekday === 0 || weekday === 6 ? 0.055 : 0.012)) return 0
      return Math.min(4, 1 + Math.floor((random + recent + (weekday > 0 && weekday < 6 ? 0.16 : 0)) * 3.15))
    })
  }

  get contributionTotal(): number { return 4680 + this.epoch * 19 + this.contributions.reduce((sum, level) => sum + level, 0) }

  get providers() {
    const offset = Math.floor(this.telemetryTick / 8) % PROVIDERS.length
    return Array.from({ length: PROVIDERS.length }, (_, index) => PROVIDERS[(offset + index) % PROVIDERS.length]!).map((provider, index) => {
      const sourceIndex = (offset + index) % PROVIDERS.length
      const pulse = Math.round(Math.sin((this.telemetryTick + sourceIndex * 2.3) * 0.7) * 2)
      const growth = Math.floor(this.telemetryTick / (2 + sourceIndex % 3))
      const used = 12 + ((provider.used - 12 + growth + pulse + 85) % 85)
      const remaining = Math.max(0, provider.resetSeconds - Math.floor(this.telemetryTick * 1.5))
      const hours = Math.floor(remaining / 3600)
      const minutes = Math.floor(remaining % 3600 / 60)
      const seconds = remaining % 60
      return {
      name: provider.name,
      model: provider.model,
      used,
      reset: `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`,
      tokens: `${(provider.tokens + this.telemetryTick * (0.0017 + sourceIndex * 0.00018)).toFixed(2)}M`,
      cost: `$${(provider.cost + this.telemetryTick * (0.014 + sourceIndex * 0.0015)).toFixed(2)}`,
      rpm: 14 + ((this.telemetryTick * 5 + sourceIndex * 11) % 58),
      latency: 360 + ((this.telemetryTick * 83 + sourceIndex * 173) % 1_040),
      }
    })
  }

  titleFor(kind: OpsCardId): string {
    return ({ board: 'Work queue', pulls: 'Pull requests', contributions: 'Contribution activity', usage: 'Provider usage', cost: 'Cost ledger', resets: 'Reset radar', release: 'Release train', fleet: 'Fleet activity' })[kind]
  }

  tasksFor(kind: OpsCardId, count = 3) {
    const start = (this.epoch + (kind === 'pulls' ? 2 : kind === 'release' ? 4 : 0)) % TASKS.length
    return Array.from({ length: Math.min(count, TASKS.length) }, (_, index) => {
      const source = TASKS[(start + index) % TASKS.length]!
      return {
        key: `${source[0]}-${index}`,
        id: source[0],
        title: source[1],
        agent: this.swarm.agents[(this.epoch + index * 3) % this.swarm.agents.length]?.label ?? 'agent',
        phase: PHASES[(this.epoch + index + (kind === 'release' ? 2 : 0)) % PHASES.length],
      }
    })
  }

  get estimatedCost(): number {
    return 84.31 + this.swarm.totalTokens / 1_000_000 * 3.7
  }

  start(): void {
    this.#layoutTimer = window.setInterval(() => {
      this.epoch += 1
    }, 8_000)
    // Content turns over frequently, while routing changes are deliberately
    // slower. A real multiviewer keeps sources spatially learnable.
    this.#sceneTimer = window.setInterval(() => {
      this.layoutEpoch += 1
    }, 32_000)
    this.#telemetryTimer = window.setInterval(() => {
      this.telemetryTick += 1
    }, 1_500)
    this.#noticeTimer = window.setInterval(() => this.#showNotice(), 23_000)
    this.#firstNotice = window.setTimeout(() => this.#showNotice(), 7_000)
  }

  stop(): void {
    clearInterval(this.#layoutTimer)
    clearInterval(this.#sceneTimer)
    clearInterval(this.#telemetryTimer)
    clearInterval(this.#noticeTimer)
    clearTimeout(this.#noticeClear)
    clearTimeout(this.#firstNotice)
  }

  #showNotice(): void {
    this.notice = NOTICES[Math.floor(this.epoch / 2) % NOTICES.length] as OpsNotice
    clearTimeout(this.#noticeClear)
    this.#noticeClear = window.setTimeout(() => {
      this.notice = null
    }, 5_800)
  }
}
