import type { Swarm } from './swarm.svelte'

export type OpsCardId = 'board' | 'pulls' | 'contributions' | 'usage' | 'cost' | 'resets' | 'release'

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
  { name: 'Anthropic', model: 'claude-fable-5', used: 78, reset: '01:42:18', tokens: '4.82M', cost: '$38.14' },
  { name: 'OpenAI', model: 'gpt-5.6-sol', used: 61, reset: 'Tue 09:00', tokens: '3.17M', cost: '$27.68' },
  { name: 'Google', model: 'gemini-3.1-pro', used: 44, reset: '00:17:42', tokens: '2.91M', cost: '$16.03' },
  { name: 'Alibaba', model: 'qwen3.7-max', used: 86, reset: 'UTC 00:00', tokens: '5.44M', cost: '$21.72' },
  { name: 'DeepSeek', model: 'deepseek-v4-pro', used: 37, reset: 'Aug 17', tokens: '1.86M', cost: '$8.95' },
] as const

const CARD_CYCLES: OpsCardId[][] = [
  ['board', 'usage'],
  ['pulls', 'contributions'],
  ['release', 'board'],
  ['usage', 'pulls'],
  ['contributions', 'release'],
]

const TASKS = [
  ['#842', 'Bound retry jitter at the tenant edge'],
  ['#863', 'Make replay idempotent across retries'],
  ['#871', 'Drain workers before key rotation'],
  ['#441', 'Move diff rendering to a worker'],
  ['#903', 'Cap the ingest queue by tenant'],
  ['v0.5.0', 'Promote signed artifacts to stable'],
] as const

const PHASES = ['queued', 'running', 'fixing', 'reviewing', 'merging'] as const

const MOSAICS = [
  ['1 / 5 / 5 / 9', '1 / 9 / 5 / 13', '1 / 1 / 5 / 5', '5 / 1 / 9 / 5', '5 / 5 / 9 / 9', '5 / 9 / 9 / 13', '9 / 1 / 13 / 5', '9 / 5 / 13 / 9', '9 / 9 / 13 / 13'],
  ['1 / 1 / 5 / 7', '1 / 7 / 7 / 10', '1 / 10 / 4 / 13', '4 / 10 / 7 / 13', '5 / 1 / 9 / 4', '5 / 4 / 9 / 7', '7 / 7 / 13 / 10', '7 / 10 / 13 / 13', '9 / 1 / 13 / 7'],
  ['1 / 1 / 9 / 4', '1 / 4 / 4 / 13', '9 / 1 / 13 / 4', '4 / 4 / 8 / 7', '4 / 7 / 8 / 10', '4 / 10 / 8 / 13', '8 / 4 / 13 / 7', '8 / 7 / 13 / 10', '8 / 10 / 13 / 13'],
] as const

// Width-to-height ratio of the two operations slots in each mosaic. JavaScript
// assigns content to an existing slot; CSS Grid remains responsible for sizing.
const OPS_SLOT_ASPECTS = [[1, 1], [1.5, 0.5], [0.375, 3]] as const
const CARD_ASPECT: Record<OpsCardId, number> = {
  contributions: 3.2,
  board: 1.8,
  pulls: 1.65,
  release: 1.4,
  cost: 1.1,
  usage: 0.72,
  resets: 0.68,
}

const NOTICES: OpsNotice[] = [
  { eyebrow: 'Anthropic · quota window', title: '5-hour allowance restored', detail: '9 sessions returned to nominal routing · next window 14:00', tone: 'coral' },
  { eyebrow: 'Release train · v0.5.0', title: 'Candidate promoted to stable', detail: 'macOS arm64 verified · Windows signing queued', tone: 'green' },
  { eyebrow: 'OpenAI · weekly window', title: 'Usage crossed 80%', detail: 'Cost router moved 3 background agents to the economy pool', tone: 'amber' },
  { eyebrow: 'Merge queue · lantern-ui', title: 'All required checks passed', detail: 'PR #441 will merge after the protected queue clears', tone: 'blue' },
]

export class OperationsWorld {
  epoch = $state(0)
  notice = $state<OpsNotice | null>(null)
  scenario = $state('Release train · reliability week')
  viewportClass = $state<'compact' | 'balanced' | 'wide'>('wide')

  #layoutTimer = 0
  #noticeTimer = 0
  #noticeClear = 0
  #firstNotice = 0

  constructor(readonly swarm: Swarm) {}

  get mosaicIndex(): number {
    if (this.viewportClass === 'compact') return -1
    if (this.viewportClass === 'balanced') return 0
    return this.epoch % MOSAICS.length
  }

  get activeCards(): OpsCardId[] {
    const cards = [...(CARD_CYCLES[this.epoch % CARD_CYCLES.length] as OpsCardId[])]
    const slots = this.mosaicIndex < 0 ? [1, 1] : (OPS_SLOT_ASPECTS[this.mosaicIndex] ?? [1, 1])
    // Largest content preference goes to the widest available slot. This keeps
    // dense horizontal visuals such as the contribution matrix out of towers.
    cards.sort((a, b) => CARD_ASPECT[b] - CARD_ASPECT[a])
    if (slots[0] < slots[1]) cards.reverse()
    return cards
  }

  get gridItems() {
    const agents = this.swarm.agents.slice(0, 7).map(agent => ({ type: 'agent' as const, key: `agent-${agent.slot}`, agent }))
    const cards = this.activeCards.map((kind, index) => ({ type: 'ops' as const, key: `ops-${index}`, kind }))
    return [...cards, ...agents]
  }

  placementAt(index: number): string { return this.mosaicIndex < 0 ? 'auto' : (MOSAICS[this.mosaicIndex]?.[index] ?? 'auto') }

  setViewport(width: number, height: number): void {
    const next = width < 720 ? 'compact' : width / Math.max(height, 1) < 1.05 ? 'balanced' : 'wide'
    if (next !== this.viewportClass) this.viewportClass = next
  }

  get activeAgent(): string { return this.swarm.agents[(this.epoch * 3 + 2) % this.swarm.agents.length]?.label ?? 'agent' }

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
    return PROVIDERS.slice(0, 4).map((provider, index) => ({
      name: provider.name,
      model: provider.model,
      used: Math.min(96, provider.used + ((this.epoch + index * 2) % 7) - 3),
      reset: provider.reset,
      tokens: provider.tokens,
      cost: provider.cost,
    }))
  }

  titleFor(kind: OpsCardId): string {
    return ({ board: 'Work queue', pulls: 'Pull requests', contributions: 'Contribution activity', usage: 'Provider usage', cost: 'Cost ledger', resets: 'Reset radar', release: 'Release train' })[kind]
  }

  tasksFor(kind: OpsCardId) {
    const start = (this.epoch + (kind === 'pulls' ? 2 : kind === 'release' ? 4 : 0)) % TASKS.length
    return Array.from({ length: 3 }, (_, index) => {
      const source = TASKS[(start + index) % TASKS.length]!
      return {
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
    this.#noticeTimer = window.setInterval(() => this.#showNotice(), 23_000)
    this.#firstNotice = window.setTimeout(() => this.#showNotice(), 7_000)
  }

  stop(): void {
    clearInterval(this.#layoutTimer)
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
