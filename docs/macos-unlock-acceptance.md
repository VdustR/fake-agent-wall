# macOS unlock focus acceptance

## Historical failure and released fix

The reported symptom is a visible wall after unlock that receives no Escape
input until clicked. Before the v0.12.0 fix, the shell recovered focus only after window blur,
using `show`, `moveTop`, and window `focus`; it did not observe session recovery
or explicitly activate the macOS application.

[Electron powerMonitor](https://www.electronjs.org/docs/latest/api/power-monitor)
provides lock/unlock, suspend/resume, and macOS login-session events.
[app.focus](https://www.electronjs.org/docs/latest/api/app#appfocusoptions)
can activate a macOS application with `steal: true`. Use it only while the
production wall is playing, before focusing the preferred display's window.
Pause recovery during lock, sleep, and an inactive login session; reset pending
Escape input. An unlock clears both lock and prior sleep blocks because it
confirms the machine is awake and authentication has completed. An inactive
login session remains independently blocked. Queue delayed recovery when the
remaining blocks clear. Idle
start also waits for an active session, including after its asynchronous check.

A simulation reproduces the inactive-application mechanism and verifies the
activation order. Event-driven tests cover lock/unlock without another blur,
resume before unlock, unlock before delayed resume, session switching,
cancellation, and observer cleanup.
These tests do not prove macOS WindowServer behavior, event timing, Touch ID,
Spaces, physical displays, or Escape delivery after real authentication.

## Historical device evidence

The first lid-close/open acceptance failed. The recorded sequence was suspend
at 05:46:33 UTC, lock at 05:46:33, unlock at 05:46:34, then resume at 05:47:03
on October 2, 2026. One second after unlock the visible wall was unfocused.
Waiting for both independent lock and sleep blocks prevented recovery for about
28 seconds. A regression test replays this order; unlock now supersedes the
earlier sleep block.

The operator reported the corrected acceptance run passed on October 2, 2026,
and authorized merge, release, and installation. On macOS 26.6.2 (25G83), the
corrected trace records suspend, lock, unlock, and window focus 112 ms after
unlock; the one-second readback confirms both window and web-content focus.
Another locked sleep/wake sequence keeps the wall unfocused until unlock, then
receives Escape input and closes on a full hold and release. This evidence
covers the operator's laptop acceptance; it does not establish multi-display,
other macOS versions, or every authentication method.

The macOS Node-API presentation guard uses AppKit's `disableProcessSwitching`
and `disableHideApplication` with a hidden Dock and menu bar. It omits
`disableForceQuit`, `disableSessionTermination`, and `disableAppleMenu`.
Electron's kiosk preset includes the first two, so it cannot preserve the
required emergency exit. See [AppKit presentation options](https://developer.apple.com/documentation/appkit/nsapplication/presentationoptions-swift.struct)
and [Electron 43.3.0 implementation](https://github.com/electron/electron/blob/v43.3.0/shell/browser/native_window_mac.mm).
The guard runs inside Electron's main process; a separate Swift process cannot
set Electron's application presentation. It restores its snapshot before
window teardown or display reconciliation, and releases it during lock, sleep,
and inactive login sessions. No global shortcut registration, input monitoring,
Accessibility permission, or persistent system setting is added.

Run `pnpm build:native` followed by
`pnpm exec electron desktop/presentation-guard-smoke.cjs` on macOS to verify
the actual AppKit flags, repeated enable/disable, reacquisition after release,
and restoration before and after simple-fullscreen teardown. The macOS CI job
runs the same smoke test. It does not simulate hardware key behavior.

## Current acceptance

The preceding observations describe the October 2 acceptance environment, not
new evidence for a later runtime or lifecycle refactor. The raw temporary
traces are no longer available. Preserve their documented scope and do not
claim a fresh reproduction from this record alone.

Use the [current foreground acceptance procedure](macos-foreground-acceptance.md#physical-acceptance)
for the final candidate. The [lifecycle evidence ledger](macos-wall-lifecycle.md)
identifies source/runtime changes that reopen verification. It replaces the
older repeated full-device procedure; no three-run authentication matrix is
required without evidence that those combinations behave differently.
