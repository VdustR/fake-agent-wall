const assert = require('node:assert/strict')
const { spawnSync } = require('node:child_process')
const { mkdtempSync, readFileSync, rmSync } = require('node:fs')
const { tmpdir } = require('node:os')
const { join } = require('node:path')

// The child owns only hidden windows, an ephemeral loopback server, and this profile.
const runDir = mkdtempSync(join(tmpdir(), 'fake-wall-electron-contracts-'))
try {
  const child = spawnSync(require('electron'), [join(__dirname, 'main.cjs')], {
    env: { ...process.env, CONTRACT_RUN_DIR: runDir },
    encoding: 'utf8',
    timeout: 90000,
  })
  if (child.stdout) process.stdout.write(child.stdout)
  if (child.stderr) process.stderr.write(child.stderr)
  if (child.error) throw child.error
  assert.equal(child.signal, null, 'native contract process must exit normally')
  const result = JSON.parse(readFileSync(join(runDir, 'results.json'), 'utf8'))
  assert.equal(result.electron, require('electron/package.json').version, 'test the installed runtime')
  assert.deepEqual(result.results.map(test => test.name), [
    'top-level-sandbox-popup',
    'file-http-cross-origin-opaque',
    'webview-worker-node-inheritance',
    'preload-cache-principal-separation',
  ])
  assert.ok(result.results.every(test => test.pass === true && !test.error), 'all four contracts must pass')
  assert.equal(child.status, 0, 'native contract process must succeed')
} finally {
  rmSync(runDir, { recursive: true, force: true, maxRetries: 10, retryDelay: 100 })
}
