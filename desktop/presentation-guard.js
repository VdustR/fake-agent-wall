import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const require = createRequire(import.meta.url)
let native = null

export function setPresentationGuard(enabled) {
  if (process.platform !== 'darwin') return
  native ??= require(join(
    process.resourcesPath && !process.defaultApp
      ? process.resourcesPath
      : join(dirname(fileURLToPath(import.meta.url)), 'bin'),
    'presentation-guard.node',
  ))
  native.setEnabled(enabled)
}
