# Playback acceptance

## Intended result

The wall activates once, accepts held Escape while foreground, and closes when
the operator switches apps. Both manual and idle playback follow this rule.
Lock/sleep closes playback; unlock never restores it. See the
[lifecycle design and evidence reuse rules](macos-wall-lifecycle.md).

Use the final PR source and an isolated profile. Do not replace the installed
app or its settings until acceptance and release are complete. The latest
experiment runs on macOS 26.6.2 (25G83), Electron 43.5.0, one 1680 × 1050 display
at scale 2. Current-head CI is recorded in
[the lifecycle PR](https://github.com/VdustR/fake-agent-wall/pull/62).

## Executable checks

- `pnpm test` covers app departure for both origins, three platform branches,
  internal window transfers, native menu lifetime, initial focus failure, held
  Escape and cancellation, hardware/shortcut pass-through, overlapping session
  blockers, delayed resume, a fresh idle interval, and camera protection.
- `pnpm test:desktop` runs the production entrypoint in real Electron with a
  temporary profile. It verifies initial focus, transfer to another window in
  the same app, native deactivation by a task-owned second app process, complete
  wall teardown, and no restoration after synthetic session events. The child
  activator is stopped before cleanup. No Accessibility grant is needed.
- `pnpm lint`, `pnpm check`, `pnpm build`, `pnpm build:native`, and
  `pnpm test:electron-security` remain required. Five inherited lint warnings
  in the existing security fixture are not introduced by this change.

The fullscreen fixture exits through `leave-full-screen` before the next wall
starts. Killing that fixture can leave AppKit removing its Space, during which
the next fullscreen request may be ignored. This follows [Electron's test
cleanup guidance](https://github.com/electron/electron/pull/53502). The local
Electron 43.5.0/macOS 26.6.2 diagnostic failed with forced exit, passed with
event-driven exit, and failed again when forced exit was restored. The normal
exit must complete within five seconds; the contract fails rather than retrying
activation or relaxing its fullscreen assertion. This is fixture sequencing
evidence, not a new physical-device acceptance result.

These checks do not prove physical keyboard shortcuts, player controls,
authenticated unlock/lid behavior, or Windows/Linux window-manager behavior.
An earlier synthetic Command-Tab was delivered successfully by the tool but did
not commit a system app switch; that dispatch is not a keyboard acceptance pass.

## Device evidence

Before this design, the operator physically reproduced Command-Tab switching
away while the wall remained. Presentation options 298 did not prevent it.
The automatic wall then closed about 440 ms after losing foreground on
[the layer-only candidate](https://github.com/VdustR/fake-agent-wall/commit/a02e2e336fce81e1b3135f8785c3fea0c4028fdb).
That failure motivates closing on app departure, not stronger restrictions.

A separate regular-policy experiment improved synthetic input routing but
switched away from Chrome's fullscreen Space even with window level 1000.
A permission-based session event tap passed a bounded active/off counterfactual,
both switcher directions, repeated desktop/fullscreen cycles, explicit cleanup,
and a 20-second research deadline. It is not adopted or installed. The final
implementation removes both mechanisms rather than combining them.

The native-fullscreen candidate was tested on this device at
[the accepted source revision](https://github.com/VdustR/fake-agent-wall/commit/78e6435920db8b18c3e78df6290a321ec8ee9528)
on October 20, 2026, 08:28–08:32 UTC, using an isolated profile and a tagged
Chrome HTML-fullscreen video fixture:

- Manual startup acquired focus and remained active in the wall's own Space.
  A global synthetic Escape hold lasted 1,527 ms; keyup closed the wall within
  3 ms. The player retained HTML fullscreen and received no Escape event.
- Theme settings opened through the actual shortcut. Global text entry changed
  the label draft; Escape discarded it. Reopening showed the original label,
  with playback retained throughout. Select-all was not established by this test.
- Activating Chrome emitted app deactivation at 08:30:09.206; the wall closed
  at 08:30:09.207. Native presentation options returned to zero and Chrome's
  original fullscreen Space returned. Global clicks produced pause, seek, and
  play events. The first click after return only activated the player and is
  not counted as a control pass.
- Automatic startup occurred at actual OS idle 62 seconds, acquired focus,
  and remained active. A 1,575 ms Escape hold closed on keyup within 1 ms.
  Automatic startup was disabled after the test.

These are app/input/player telemetry and Accessibility observations. Synthetic
Command-Tab again did not commit an OS app switch, so physical Command-Tab
remains open. No hardware-control or authenticated wake pass is inferred.

A capture ownership control refused screenshots in this session. AX and
independent app/input/player telemetry were used; the control was not bypassed.
Muted Chromium fixtures pause themselves while occluded, so they do not prove
uninterrupted audible playback in the operator's original player.

## Controlled startup trial

The operator explicitly left the desktop untouched for the October 20
08:16 UTC trial. Chrome's tagged fixture was playing HTML fullscreen immediately
before startup. The overlay candidate became active at 08:16:22.945; macOS
returned foreground to Chrome at 08:16:23.327; the wall received deactivation at
08:16:23.367 and closed at 08:16:23.446. The Space counter changed from one to
two. This confirms the startup/Space failure without attributing it to operator
input. The idle reset is not evidence that the operator touched the desktop.

The next candidate removes the accessory overlay and uses ordinary native
fullscreen on all platforms. On macOS, entering the wall's own fullscreen Space
is intentional. CI now first opens another task-owned app fullscreen, then
verifies sustained startup focus and closure when returning to that fixture.
Current-head CI passed this contract. The device results above separately
establish the tagged Chrome fixture behavior; physical keyboard acceptance
remains open.

An earlier overlay contract failed initial focus once without phase diagnostics;
a later diagnostic run passed. That unexplained result is historical rather
than proof of the new fullscreen implementation.

## Small checks and retained premises

Test each distinct mechanism at its nearest entrypoint. Do not multiply manual
and idle startup by every exit path: both origins use the same production
window/input/session handlers. The current source and CI already establish
these premises; a resumed conversation is not a reason to replay them.

| Mechanism | Small executable check or retained observation | Remaining limit |
| --- | --- | --- |
| App departure closes all walls | `desktop/main.test.js`: emit app deactivation; assert all windows destroyed and no activation retry. Both startup origins are covered. Real Electron and Chrome activation also passed. | A real Command-Tab sequence has not been observed on this candidate. |
| Escape closes on release | `desktop/main.test.js`: keydown, advance the clock, assert alive, keyup, assert destroyed. Global device input passed for both origins with no player Escape leak. | Synthetic input does not establish every physical keyboard combination. No separate physical Escape gate is needed without contradictory evidence. |
| Session shutdown and fresh idle | `desktop/main.test.js`: emit each session blocker, assert closed; emit wake events, assert no immediate startup. `session-events.test.js` checks unlock before delayed resume; `playback-policy.test.js` checks overlapping blockers and the fresh interval. | Actual device event delivery through lid sleep/wake still needs one observation. |
| Fullscreen return and theme cancellation | Real Electron contract plus the source-pinned Chrome/theme device observations above. | The original player and physical multi-display behavior are not established. Do not repeat Chrome controls/theme edits for an unchanged runtime. |
| System shortcuts and hardware events are not consumed | `desktop/main.test.js` checks modifier shortcuts and `AudioVolumeUp` are not prevented; the native interception addon has been removed. | Physical volume/mute/brightness remain untested. Treat them as optional observations, not repeated release gates. |

For a changed mechanism, run only its focused regression first:

```sh
pnpm exec vitest run desktop/main.test.js -t 'closes on app departure'
pnpm exec vitest run desktop/main.test.js -t 'keeps held Escape'
pnpm exec vitest run desktop/session-events.test.js desktop/playback-policy.test.js
```

These are existing regression contracts, not new causal reproductions. For a
new failure, retain a small failing artifact, its exact source/runtime and
command, expected/actual output, and exit code. Before claiming its cause,
observe fail → candidate fix passes → reverted fix fails. A historical failure
followed by a later pass alone does not establish that counterfactual.

Use `pnpm test:desktop` when window/Space integration or its runtime changes,
or as a required final CI check. Do not rerun local GUI acceptance after a
wording-only edit. The CI contract remains a merge check; repeated CI execution
is not a request for another operator test. Reopen an observation only under
the invalidation rules in the lifecycle document or on contradictory evidence.

## Operator acceptance record

The operator reported both required interactions passing on October 20, 2026,
at approximately 16:40 Asia/Taipei. The isolated candidate used the unchanged
runtime source linked above; the current PR head adds test diagnostics and
evidence documentation only. No agent-generated input occurred during these
operator observations.

| Check | Operator result | Independent candidate trace (UTC) |
| --- | --- | --- |
| Physical Command-Tab after opening Wall | Wall closes. | App deactivation at 08:39:56.676; the last wall closed at 08:39:56.678. No recovery or new wall followed. |
| Close and reopen the lid after opening Wall | Wall closes. | Suspend at 08:39:40.220; last wall closed at 08:39:40.224. Lock at 08:39:41.983, resume at 08:39:42.005, unlock at 08:39:44.219; no wall was restored. |

The lid trace contains real suspend, lock, resume, and unlock events. It proves
that sequence's event delivery and shutdown, not every possible ordering or a
separate lock-only interaction. The source-pinned session regression contracts
cover the alternate event orderings. These two operator gates are complete;
do not request another run for documentation, Ready, merge, or release metadata.

A separate lock/unlock path is not physically verified by a lid test unless its
telemetry contains those events. Keep that distinction in the record; the
session-event contracts establish the shared handling. Request a separate
physical lock test only if missing or contradictory evidence makes it necessary.
Do not require another full idle stopwatch, hardware matrix, theme edit, camera
check, or model check for these observations.

If either check fails, retain its event trace and reduce that failure before
asking for another end-to-end run. Reopen the affected acceptance item if a new failure appears. Untested original-player, multi-display, Windows/Linux, and
hardware behavior stays explicitly unverified; CI success is not proof of
those environments or of release/install delivery.
