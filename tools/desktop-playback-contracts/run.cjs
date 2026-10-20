const assert = require('node:assert/strict')
const { spawnSync } = require('node:child_process')
const { mkdtempSync, readFileSync, rmSync } = require('node:fs')
const { tmpdir } = require('node:os')
const { join } = require('node:path')

const runDir = mkdtempSync(join(tmpdir(), 'fake-wall-playback-'))
try {
  const child = spawnSync(require('electron'), [join(__dirname, 'main.cjs')], {
    env: { ...process.env, PLAYBACK_RUN_DIR: runDir },
    encoding: 'utf8', timeout: 30000,
  })
  if (child.stdout) process.stdout.write(child.stdout)
  if (child.stderr) process.stderr.write(child.stderr)
  if (child.error) throw child.error
  assert.equal(child.signal, null, 'playback process must exit normally')
  assert.equal(child.status, 0, 'production playback contracts must pass')
  const result = JSON.parse(readFileSync(join(runDir, 'results.json'), 'utf8'))
  assert.equal(result.electron, require('electron/package.json').version)
  assert.deepEqual(result.passed, ['initial-focus', 'internal-window-transfer', 'app-deactivation-exit', 'session-stop'])
} finally {
  rmSync(runDir, { recursive: true, force: true, maxRetries: 10, retryDelay: 100 })
}
