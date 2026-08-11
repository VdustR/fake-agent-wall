const { execFileSync } = require('node:child_process')
const { join } = require('node:path')

/**
 * Ad-hoc sign the macOS bundle.
 *
 * electron-builder starts from Electron's own binary, which ships a
 * linker-signed ad-hoc signature identified as "Electron". Repacking renames
 * the executable and rewrites Resources, which invalidates that signature
 * without removing it. macOS then sees a bundle whose signature does not match
 * its contents and reports "the app is damaged and can't be opened" — the
 * tampering message, which offers no override. That is a strictly worse outcome
 * than shipping no signature at all, because the "Open Anyway" escape hatch in
 * Privacy & Security never appears.
 *
 * Re-signing ad-hoc makes the signature valid again. The app is still
 * unidentified, so Gatekeeper still challenges it, but it challenges it as
 * "developer cannot be verified", which the user can accept.
 *
 * arm64 additionally requires every executable to carry *some* signature, so
 * this is not optional on Apple silicon.
 */
exports.default = async function afterPack(context) {
  if (context.electronPlatformName !== 'darwin') return

  const app = join(context.appOutDir, `${context.packager.appInfo.productFilename}.app`)

  execFileSync('codesign', ['--force', '--deep', '--sign', '-', app], { stdio: 'inherit' })

  // Fail the build here rather than shipping a bundle that cannot launch.
  execFileSync('codesign', ['--verify', '--deep', '--strict', '--verbose=2', app], {
    stdio: 'inherit',
  })

  console.log(`  • ad-hoc signed and verified  app=${app}`)
}
