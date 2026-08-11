/**
 * SYNTHETIC CORPUS. Every repository, path, metric, and diff below is invented
 * for this prop. Nothing here describes a real codebase or a real measurement.
 */

export const REPOS = [
  'atlas-gateway',
  'orbit-web',
  'kestrel-runtime',
  'harbor-ingest',
  'lantern-ui',
  'sable-scheduler',
  'quarry-etl',
  'mesa-identity',
  'driftwood-cli',
  'tessera-design',
  'foxglove-api',
  'cinder-worker',
] as const

export const BRANCHES = [
  'main',
  'next',
  'feat/session-resume',
  'fix/webhook-replay',
  'chore/oxc-migration',
  'perf/cold-start',
  'feat/streaming-diff',
  'refactor/queue-policy',
  'fix/tz-boundaries',
  'feat/tenant-scoping',
] as const

export const TASKS = [
  'migrate the retry policy off ad-hoc backoff',
  'replace the eslint pipeline with oxlint',
  'make webhook replay idempotent',
  'split the session store from the transport layer',
  'cut cold-start below the streaming budget',
  'backfill tests for the jittered scheduler',
  'thread tenant scoping through the query builder',
  'stop the resume path from double-charging tokens',
  'unbreak timezone boundaries in the digest job',
  'move the diff renderer to a worker',
  'audit every unbounded queue in the ingest path',
  'delete the last three feature flags',
  'give the CLI a real exit-code contract',
  'de-duplicate the two markdown parsers',
] as const

export const AGENT_ROLES = [
  'refactor',
  'explore',
  'harden',
  'migrate',
  'triage',
  'bench',
  'audit',
  'backfill',
  'reduce',
  'wire',
] as const

export const DIRS = [
  'src/server/session',
  'src/routes/api/webhook',
  'packages/core/src/queue',
  'packages/runtime/src/stream',
  'src/lib/db/query',
  'apps/web/src/routes',
  'services/ingest/pipeline',
  'packages/cli/src/commands',
  'src/domain/tenant',
  'packages/design/tokens',
] as const

export const FILES = [
  'resume.ts',
  'policy.ts',
  'backoff.ts',
  'replay.ts',
  '+server.ts',
  'worker.ts',
  'schema.ts',
  'transport.ts',
  'scope.ts',
  'digest.ts',
  'index.ts',
  'client.ts',
  'budget.ts',
  'cursor.ts',
] as const

export const SYMBOLS = [
  'createSession(',
  'resumeFrom(',
  'withTenant(',
  'nextBackoff(',
  'flushQueue(',
  'replayGuard(',
  'renderDiff(',
  'coldStart(',
  'budgetFor(',
  'settleCursor(',
] as const

export const BASH = [
  'pnpm vitest run packages/core --reporter=dot',
  'pnpm oxlint . --max-warnings 0',
  'pnpm tsc -p tsconfig.json --noEmit',
  'pnpm build --filter kestrel-runtime',
  'git diff --stat HEAD~1',
  'pnpm bench queue --iterations 2000',
  'pnpm vitest run --coverage packages/runtime',
  'rg -n "unbounded" services/ingest --stats',
  'pnpm dlx depcheck --skip-missing',
  'git log --oneline -12',
  'pnpm exec playwright test --project=chromium',
  'docker compose run --rm migrate up',
] as const

export const BASH_DESC = [
  'Run the core unit suite',
  'Lint the workspace with oxlint',
  'Type-check without emitting',
  'Build the runtime package',
  'Inspect the last commit',
  'Benchmark the queue path',
  'Measure coverage on the runtime',
  'Count unbounded queue sites',
  'Find unused dependencies',
  'Read recent history',
  'Run the browser smoke suite',
  'Apply pending migrations',
] as const

export const PROSE = [
  'The backoff math is duplicated in three places. I will lift it into one module and have the callers depend on that.',
  'Two of these tests only pass because the fake clock never advances. I am replacing the clock, not the assertion.',
  'This path allocates a new buffer per chunk. That is the cold-start cost, not the parser.',
  'The replay guard keys on request id, but the sender reuses ids across retries. That is the actual bug.',
  'I found the scoping leak: the query builder caches the tenant on first use and never invalidates it.',
  'Coverage is fine. The gap is that nothing exercises the jittered branch at all.',
  'Everything under this directory imports the barrel file, which is why one edit rebuilds the world.',
  'The migration is reversible. I will still write the down step before touching the up step.',
  'This is a rendering problem wearing a data problem’s clothes. The diff is correct; the renderer truncates it.',
  'Three feature flags are permanently on in every environment. I am deleting them and their branches.',
] as const

export const TODOS = [
  'Extract the retry policy into its own module',
  'Delete the ad-hoc backoff math',
  'Wire the policy into the queue worker',
  'Backfill tests for the jittered branch',
  'Make the replay guard key on payload hash',
  'Move the diff renderer off the main thread',
  'Thread tenant scope through the builder',
  'Write the down migration first',
  'Remove the three permanent feature flags',
  'Give every command a real exit code',
  'Cap the ingest queue at a bounded size',
  'Document the resume contract',
] as const

export const MODELS = ['opus-5', 'opus-5', 'opus-5', 'sonnet-5', 'sonnet-5', 'haiku-4.5'] as const

export const SUBAGENTS = [
  'explore',
  'general-purpose',
  'code-reviewer',
  'light-worker',
  'plan',
] as const

/** Code fragments used to build diff hunks. Shape matters more than meaning. */
export const CODE_DEL = [
  'const raw = await request.text()',
  'let delay = base * 2 ** attempt',
  'if (!session) throw new Error("missing session")',
  'return rows.filter((r) => r.tenant === ctx.tenant)',
  'await queue.push(job)',
  'const cache = new Map<string, Row[]>()',
  'setTimeout(() => flush(), 250)',
  'export const MAX = 100',
  'if (seen.has(id)) return',
  'const parsed = JSON.parse(body)',
] as const

export const CODE_ADD = [
  'const raw = await request.arrayBuffer()',
  'const delay = policy.next(attempt, { jitter: true })',
  'if (!session) return err("SESSION_MISSING", { id })',
  'return rows.filter((r) => scope.owns(r))',
  'await queue.push(job, { bounded: true })',
  'const cache = new LruCache<string, Row[]>({ max: 512 })',
  'queueMicrotask(flush)',
  'export const MAX = Number(env.QUEUE_MAX ?? 100)',
  'if (seen.has(hashOf(payload))) return',
  'const parsed = Schema.parse(await json(body))',
] as const

export const CODE_CTX = [
  '}',
  '',
  'export async function handle(request: Request) {',
  '  const ctx = await context(request)',
  '  try {',
  '  } finally {',
  '    span.end()',
  '  const scope = tenantScope(ctx)',
  '// TODO: bound this',
  '  const policy = retryPolicy(config)',
] as const

export const ERRORS = [
  'FAIL packages/core/queue.test.ts > backoff caps at ceiling',
  'AssertionError: expected 4000 to be less than or equal to 3000',
  'TypeError: Cannot read properties of undefined (reading "tenant")',
  'error TS2345: Argument of type "string" is not assignable to parameter of type "TenantId"',
  'ELIFECYCLE  Command failed with exit code 1.',
] as const
