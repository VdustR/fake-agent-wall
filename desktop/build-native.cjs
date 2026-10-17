const { execFileSync } = require('node:child_process')
const { mkdirSync } = require('node:fs')
const { join } = require('node:path')

if (process.platform === 'darwin') {
  const desktop = __dirname
  const outputDir = join(desktop, 'bin')
  mkdirSync(outputDir, { recursive: true })
  require('./build-presentation-guard.cjs').buildPresentationGuard(
    join(outputDir, 'presentation-guard.node'),
  )

  execFileSync('xcrun', [
    'swiftc',
    '-O',
    '-framework', 'CoreMediaIO',
    join(desktop, 'native', 'activity-monitor.swift'),
    '-o', join(outputDir, 'activity-monitor'),
  ], { stdio: 'inherit' })
}
