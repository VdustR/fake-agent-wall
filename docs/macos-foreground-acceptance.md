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

For the new production-entrypoint candidate, an agent-driven switch to Chrome
at 07:49:07.372 UTC emitted application deactivation and closed the manual wall
at 07:49:07.411. Options remained zero; there was no recovery attempt. This
verifies real app departure, not a physical Command-Tab sequence. Further device
results must identify the source and limits before being added here.

A capture ownership control refused screenshots in this session. AX and
independent app/input/player telemetry were used; the control was not bypassed.
Muted Chromium fixtures pause themselves while occluded, so they do not prove
uninterrupted audible playback in the operator's original player.

## Unresolved startup trial

The new candidate's fullscreen-player startup has not passed. Trials with and
without an explicit pre-show app activation both briefly took focus, changed
Spaces, and returned focus to Chrome. Restoring Electron simple fullscreen for
appearance is a separate unaccepted trial. Unexpected OS idle resets during a
file-only setup command suggest possible external input, but its source is not
known. Repeat only this discriminating trial on a quiescent desktop; do not
repeat unrelated checks or classify the existing results as passes.

A native contract rerun also failed initial focus once without phase diagnostics.
The next run with phase/event diagnostics passed. The unexplained failure remains
recorded; it does not establish stable fullscreen startup. The implemented
startup deadline closes a wall that fails to acquire focus rather than retrying.

## Physical acceptance

Only run operator checks after agent checks for the final candidate pass.

| Check | Steps | Expected result |
| --- | --- | --- |
| Fullscreen player and app switching | Play the affected video fullscreen; start the wall manually or wait for idle. Use Command-Tab to return to the player, then pause/play and seek. | Every wall closes when switching apps. No recovery, lingering overlay, new permission request, or unexpected Space change. The player remains usable. |
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
