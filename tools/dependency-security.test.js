import { mkdtemp, mkdir, writeFile, rm, realpath } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { resolveConfig } from 'vite'
import { expect, test } from 'vitest'

// Resolve the actual consumers' dependencies, rather than adding test-only copies.
const require = createRequire(import.meta.url)
const builderRequire = createRequire(require.resolve('electron-builder'))
const appBuilderRequire = createRequire(builderRequire.resolve('app-builder-lib'))
const yaml = appBuilderRequire('js-yaml')
const vitestRequire = createRequire(require.resolve('vitest/package.json'))
const { interceptorPlugin } = await import(pathToFileURL(vitestRequire.resolve('@vitest/mocker/node')).href)

test('YAML merge budgets include empty source mappings', () => {
  // https://github.com/nodeca/js-yaml/security/advisories/GHSA-2883-xcg3-v3hh
  expect(() => yaml.load('arr: &arr [{}, {}, {}, {}]\ntarget: { <<: *arr }', {
    maxTotalMergeKeys: 2,
  })).toThrow(/maxTotalMergeKeys/)
  expect(yaml.load('base: &base { answer: 42 }\ntarget: { <<: *base }').target).toEqual({ answer: 42 })
})

test.each([
  ['outside-root', 'opaque:../canary.js', false],
  ['denied-in-root', 'opaque:.env.fixture', false],
  ['allowed-in-root', 'opaque:allowed.js', true],
])('%s redirect mock respects Vite file access rules', async (_name, redirect, allowed) => {
  // https://github.com/vitest-dev/vitest/security/advisories/GHSA-82fw-gwwq-j7x9
  const fixture = await realpath(await mkdtemp(join(tmpdir(), 'fake-wall-security-')))
  try {
    const root = join(fixture, 'root')
    await mkdir(root)
    const source = 'export default "harmless-owned-canary"'
    await Promise.all([
      writeFile(join(fixture, 'canary.js'), source),
      writeFile(join(root, '.env.fixture'), source),
      writeFile(join(root, 'allowed.js'), source),
    ])
    const config = await resolveConfig({
      configFile: false,
      root,
      server: { fs: { strict: true, allow: [root], deny: ['**/.env*'] } },
    }, 'serve')
    const handlers = new Map()
    const plugin = interceptorPlugin()
    plugin.configureServer({
      config,
      ws: { on: (name, callback) => handlers.set(name, callback), send: () => {} },
    })
    const register = handlers.get('vitest:interceptor:register')
    const id = '/victim.js'
    await register({ type: 'redirect', raw: id, id, url: id, redirect })
    expect(await plugin.load.handler.call({}, id)).toBe(allowed ? source : undefined)
  } finally {
    await rm(fixture, { recursive: true, force: true })
  }
})
