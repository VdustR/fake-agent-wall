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

## Physical acceptance

Only run operator checks after agent checks for the final candidate pass.

| Check | Steps | Expected result |
| --- | --- | --- |
| Fullscreen player and app switching | Play the affected video fullscreen; start the wall manually or wait for idle. Use Command-Tab to return to the player, then pause/play and seek. | Every wall closes when switching apps. No recovery, lingering wall, or new permission request. Entering the wall's own Space is expected; switching back must reveal the player's Space normally. The player remains usable. |
| Escape and hardware controls | Start again. Try volume/mute/brightness, then hold Escape for at least 1.2 seconds and release. | Hardware controls remain usable. Wall stays until Escape release, then closes; Escape must not leave the revealed player fullscreen. |
| Real lock/lid wake | Start the wall, lock or close the lid, then authenticate after waking. | Wall has closed and does not cover the unlocked desktop. Another automatic start waits the complete configured idle interval. No extra click or Escape is needed. |

The agent should execute everything its tools can establish and leave only
physical input/authentication observations to the operator. Share unchanged
hardware checks across startup origins. Do not repeat the full idle stopwatch,
model catalog, or camera/audio matrix without a changed assumption.

If a check fails, stop the candidate and reopen only the affected behavior.
Keep the PR Draft while material implementation or acceptance remains open.
Multi-display hardware and untested desktop environments stay explicitly
unverified. CI success is not physical acceptance or release/install proof.
