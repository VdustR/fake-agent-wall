const { execFileSync } = require('node:child_process')
const { existsSync } = require('node:fs')
const { dirname, join } = require('node:path')

exports.buildPresentationGuard = function (output, target) {
  // The Node distribution includes ABI-stable Node-API headers. No Electron
  // headers, native dependency installer, or per-Electron rebuild is needed.
  const include = join(dirname(process.execPath), '..', 'include', 'node')
  if (!existsSync(join(include, 'node_api.h'))) {
    throw new Error('The Node toolchain must include Node-API headers')
  }
  execFileSync('xcrun', [
    'clang++', '-std=c++17', '-O2', '-bundle', '-undefined', 'dynamic_lookup',
    '-fobjc-arc', '-framework', 'AppKit', '-framework', 'CoreGraphics', '-I', include,
    ...(target ? ['-target', target] : []),
    join(__dirname, 'native', 'presentation-guard.mm'), '-o', output,
  ], { stdio: 'inherit' })
}
