# macOS unlock focus acceptance

## Observation and proposed fix

The reported symptom is a visible wall after unlock that receives no Escape
input until clicked. The current shell recovers focus only after window blur,
using `show`, `moveTop`, and window `focus`; it never observes session recovery
or explicitly activates the macOS application.

[Electron powerMonitor](https://www.electronjs.org/docs/latest/api/power-monitor)
provides lock/unlock, suspend/resume, and macOS login-session events.
[app.focus](https://www.electronjs.org/docs/latest/api/app#appfocusoptions)
can activate a macOS application with `steal: true`. Use it only while the
production wall is playing, before focusing the preferred display's window.
Pause recovery during lock, sleep, and an inactive login session; reset pending
Escape input. When all observed blocks clear, queue one delayed recovery. Idle
start also waits for an active session, including after its asynchronous check.

A simulation reproduces the inactive-application mechanism and verifies the
activation order. Event-driven tests cover lock/unlock without another blur,
both sleep/unlock orders, session switching, cancellation, and observer cleanup.
These tests do not prove macOS WindowServer behavior, event timing, Touch ID,
Spaces, physical displays, or Escape delivery after real authentication.

## Device procedure

Use an unpackaged build from this PR, with its own `--user-data-dir`, so the
installed app cannot intercept it via Electron's single-instance lock. Stop
the installed wall first. Do not replace `/Applications/Fake Agent Wall.app`
or publish a release for this acceptance run.

1. Build with `pnpm build` and `pnpm build:native`. Launch the production shell
   with `pnpm exec electron . --user-data-dir=/tmp/fake-agent-wall-unlock-acceptance`.
   Keep windowed mode and simulated displays disabled. Confirm ordinary exit:
   hold Escape at least 1.2 seconds, then release it; the wall closes on release.
2. Play again. Lock with Control-Command-Q while the wall is visible. Unlock
   normally, wait one second, and do not click the wall. Hold Escape at least
   1.2 seconds and release. It must close on that first attempt. Repeat three
   times; include Touch ID and password if both are available.
3. Repeat with sleep while locked, then wake and authenticate. The lock screen
   must remain usable; the wall must not activate before authentication. After
   unlocking, the same Escape gesture must work without clicking.
4. Confirm controls: with playback stopped, lock/unlock must not reopen the
   wall. In `AGENT_WALL_WINDOWED=1` mode, unlock must not take focus from another
   app. Start an Escape hold before locking; after unlock, a fresh full hold
   must be required. If multiple physical displays or Spaces are used, repeat
   on each configuration and record which ones were actually exercised.
5. Quit the acceptance instance from its tray. Report macOS version, display
   configuration, unlock method, pass/fail for each step, and any required click
   or delay. A failure leaves the PR Draft and blocks release/install.

The tray's Stop/Quit menu is the fallback if Escape still fails. Device
acceptance is required before merging this focus change; unit tests and CI alone
cannot establish the reported bug is fixed.
