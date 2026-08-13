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
  'prove the Rust parser is free of allocation regressions',
  'repair the Python ingestion pipeline after a schema drift',
  'make the Go worker drain cleanly during a rolling deploy',
  'plan the Terraform change without replacing the database',
  'trace the slow query through the Postgres execution plan',
  'close the keyboard trap in the billing modal',
  'rotate the signing keys without invalidating active sessions',
  'reconcile the OpenAPI contract with the generated SDKs',
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

/**
 * Current frontier coding/agent models. The mix is deliberately heterogeneous:
 * Swarmdeck is the orchestration surface, so a source identifies its upstream
 * provider instead of pretending every worker is a Claude Code session.
 */
export const MODELS = [
  { name: 'claude-fable-5', provider: 'anthropic' },
  { name: 'claude-opus-4.8', provider: 'anthropic' },
  { name: 'gpt-5.6-sol', provider: 'openai' },
  { name: 'gpt-5.6-terra', provider: 'openai' },
  { name: 'gpt-5.6-luna', provider: 'openai' },
  { name: 'gemini-3.1-pro', provider: 'google' },
  { name: 'gemini-3.6-flash', provider: 'google' },
  { name: 'grok-4.5', provider: 'xai' },
  { name: 'deepseek-v4-pro', provider: 'deepseek' },
  { name: 'deepseek-v4-flash', provider: 'deepseek' },
  { name: 'qwen3.7-max', provider: 'alibaba' },
  { name: 'qwen3.7-plus', provider: 'alibaba' },
  { name: 'kimi-k2.6', provider: 'moonshot' },
  { name: 'glm-5.1', provider: 'zai' },
  { name: 'minimax-m2.7', provider: 'minimax' },
  { name: 'ernie-5.1', provider: 'baidu' },
] as const

/**
 * Fleet-level execution policies, not provider CLI flags. The duplication is
 * intentional weighting: unattended workers mostly run autonomously, while a
 * small review cohort preserves permission-prompt activity on the wall.
 */
export const EXECUTION_POLICIES = [
  { label: 'auto · full access', prompts: false },
  { label: 'auto · full access', prompts: false },
  { label: 'auto · full access', prompts: false },
  { label: 'bypass permissions', prompts: false },
  { label: 'bypass permissions', prompts: false },
  { label: 'auto review · workspace', prompts: true },
] as const

export const SUBAGENTS = [
  'explore',
  'general-purpose',
  'code-reviewer',
  'light-worker',
  'plan',
] as const

/** Coherent diff scenes: path, syntax, and change belong to the same language. */
export const CODE_SCENES = [
  {
    path: 'packages/runtime/src/queue/policy.ts',
    before: ['const delay = base * 2 ** attempt', 'await queue.push(job)'],
    after: ['const delay = policy.next(attempt, { jitter: true })', 'await queue.push(job, { bounded: true })'],
    context: ['export async function dispatch(job: Job) {', '  const policy = retryPolicy(config)', '}'],
  },
  {
    path: 'crates/parser/src/stream.rs',
    before: ['let frame = buffer.to_vec();', 'frames.push(frame);'],
    after: ['let frame = Bytes::copy_from_slice(buffer);', 'sender.send(frame).await?;'],
    context: ['pub async fn decode(buffer: &[u8]) -> Result<()> {', '    metrics.frames.inc();', '}'],
  },
  {
    path: 'services/ingest/pipeline/batch.py',
    before: ['rows = [json.loads(line) for line in payload]', 'session.add_all(rows)'],
    after: ['rows = [Event.model_validate_json(line) for line in payload]', 'session.execute(insert(Event), rows)'],
    context: ['async def ingest(payload: list[str]) -> int:', '    async with session.begin():', '    return len(rows)'],
  },
  {
    path: 'cmd/worker/drain.go',
    before: ['close(jobs)', 'return nil'],
    after: ['stop := queue.BeginDrain()', 'return stop.Wait(ctx)'],
    context: ['func shutdown(ctx context.Context) error {', '    logger.Info("draining worker")', '}'],
  },
  {
    path: 'db/migrations/042_tenant_events.sql',
    before: ['CREATE INDEX events_tenant_idx ON events (tenant_id);'],
    after: ['CREATE INDEX CONCURRENTLY events_tenant_created_idx', '  ON events (tenant_id, created_at DESC);'],
    context: ['-- CONCURRENTLY must run outside a transaction block', '-- Preserve writes while the index is built', 'ANALYZE events;'],
  },
  {
    path: 'infra/modules/database/main.tf',
    before: ['deletion_protection = false', 'apply_immediately   = true'],
    after: ['deletion_protection = true', 'apply_immediately   = var.environment != "production"'],
    context: ['resource "aws_rds_cluster" "primary" {', '  engine = "aurora-postgresql"', '}'],
  },
  {
    path: 'deploy/base/worker.yaml',
    before: ['replicas: 1', 'memory: 256Mi'],
    after: ['replicas: 3', 'memory: 512Mi', 'maxUnavailable: 0'],
    context: ['kind: Deployment', 'spec:', '  strategy:'],
  },
  {
    path: 'apps/ios/Sources/SessionStore.swift',
    before: ['self.sessions = try await api.fetchSessions()', 'isLoading = false'],
    after: ['defer { isLoading = false }', 'self.sessions = try await api.fetchSessions()'],
    context: ['@MainActor', 'func refresh() async throws {', '}'],
  },
  {
    path: 'apps/android/data/SessionRepository.kt',
    before: ['return api.sessions().map { it.toDomain() }'],
    after: ['return cache.getOrPut("sessions") {', '    api.sessions().map(SessionDto::toDomain)', '}'],
    context: ['suspend fun sessions(): List<Session> {', '    coroutineContext.ensureActive()', '}'],
  },
  {
    path: 'scripts/rotate-signing-keys.sh',
    before: ['kubectl delete secret signing-key', 'kubectl create secret generic signing-key'],
    after: ['kubectl apply -f "$next_key_manifest"', 'kubectl rollout status deploy/api --timeout=120s'],
    context: ['set -euo pipefail', 'next_key_manifest="${1:?manifest required}"', 'echo "rotation complete"'],
  },
  {
    path: 'apps/web/src/routes/billing/+page.svelte',
    before: ['<div class="modal" on:keydown={trapFocus}>', '<button on:click={close}>×</button>'],
    after: ['<dialog bind:this={dialog} oncancel={close}>', '<button onclick={close} aria-label="Close billing">×</button>'],
    context: ['<script lang="ts">', '  let dialog: HTMLDialogElement', '</dialog>'],
  },
  {
    path: 'api/schema/session.graphql',
    before: ['expiresAt: String!', 'ownerId: String!'],
    after: ['expiresAt: DateTime!', 'owner: User!'],
    context: ['type Session implements Node {', '  id: ID!', '}'],
  },
] as const

export const ERRORS = [
  'FAIL packages/core/queue.test.ts > backoff caps at ceiling',
  'AssertionError: expected 4000 to be less than or equal to 3000',
  'TypeError: Cannot read properties of undefined (reading "tenant")',
  'error TS2345: Argument of type "string" is not assignable to parameter of type "TenantId"',
  'ELIFECYCLE  Command failed with exit code 1.',
] as const
