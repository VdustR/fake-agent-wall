# Wall playback lifecycle

The wall takes focus once at startup and closes when the operator leaves the
app. This replaces focus recovery and system-shortcut restrictions in
[the playback lifecycle PR](https://github.com/VdustR/fake-agent-wall/pull/62).
The [acceptance procedure](macos-foreground-acceptance.md) separates executable
contracts from physical keyboard, player, and wake observations.

## Behavior

| Situation | Result |
| --- | --- |
| Manual or idle startup | Show the wall on every display. Activate the preferred wall once; secondary walls do not activate. |
| Initial focus is not acquired | Close after the one-second startup check. Do not retry activation or retain an inert overlay. |
| The operator switches to another app | Close every wall, for both startup origins. No focus recovery or background retention. |
| Focus moves between this app's windows | Keep playback. Cancel any incomplete Escape hold. |
| Theme settings or the app's native menu opens | Keep playback while the operator remains within the app. Theme settings live in the same WebContents. |
| A wall is hidden, or the last wall closes | End playback. The tray remains available. |
| Lock, sleep, or inactive login session | Close the wall and block idle startup. Unlock/resume never reopens it directly. |
| Playback ends, or the final session block clears | Wait the entire configured idle interval, also respecting actual OS idle time, before another automatic startup. |

The foreground wall still consumes ordinary typing. Holding Escape for 1,200 ms
arms exit; its keyup is consumed before all walls close. Modifier shortcuts and
volume/mute/brightness events pass through. Command-Tab, Alt-Tab, application
hiding, and ordinary system escape routes are not disabled.

Automatic startup can still cover an unattended video. Audio/fullscreen delay
stays removed; the camera safeguard and its opt-out remain unchanged. Switching
back to the player now ends the wall instead of competing for focus.

## Ownership and platform behavior

- `main.js` owns windows, the one activation attempt, Escape, and teardown.
  macOS uses Electron's application-level `did-resign-active` event, not
  individual window blur, to detect leaving the app.
- Windows/Linux defer the window-blur check to the next timer turn and inspect
  `BrowserWindow.getFocusedWindow()`. Another focused app window preserves
  playback. A native tray menu temporarily defers that check until it closes.
  These platform branches have integration tests; physical desktop environments
  remain a separate verification claim.
- `createPlaybackPolicy` owns playback, overlapping session blockers, and idle
  timing. It has no foreground recovery or restriction state.
- `observeSessionState` translates power/session events. Unlock clears a stale
  sleep block because a real lid trace delivered unlock before delayed resume.
  An inactive login session still blocks startup; repeated resume does not
  extend an already-started idle interval.
- All platforms use ordinary OS fullscreen. On macOS this deliberately enters
  a separate wall Space. Switching to the player closes the wall instead of
  trying to place an activating accessory overlay in the player's fullscreen
  Space. There is no all-Spaces, always-on-top, or simple-fullscreen setup.

There is no native presentation addon, window-coverage polling, global keyboard
tap, new Accessibility permission, delayed focus recovery, or unlock activation.
The remaining native activity helper only implements the camera safeguard.

## Alternatives

| Approach | Outcome |
| --- | --- |
| Enforce foreground and block system switching | Accessory presentation flags failed physical Command-Tab acceptance. Temporary regular policy improved routing but changed the player's fullscreen Space. Reject. |
| Add a permission-based keyboard tap | A bounded separate probe passed synthetic interception and preserved Spaces, but requires permission onboarding and more lifecycle responsibility. Not adopted. |
| Show an inactive overlay | Can obscure the player while keyboard input remains elsewhere, recreating the confusing Escape failure. Reject. |
| Native fullscreen, activate once, and close on app departure | Preserves automatic display while making application switching a natural exit. Adopt. |

Electron 43.5 documents [application deactivation](https://github.com/electron/electron/blob/v43.5.0/docs/api/app.md#event-did-resign-active-macos),
[window focus aggregation](https://github.com/electron/electron/blob/v43.5.0/docs/api/browser-window.md#browserwindowgetfocusedwindow),
and [native menu lifecycle](https://github.com/electron/electron/blob/v43.5.0/docs/api/menu.md#event-menu-will-close).
Windows/Linux focus acquisition remains subject to OS/window-manager policy;
Wayland does not generally permit unsolicited focus. A failed initial attempt
ends playback rather than escalating privileges or retrying.

## Current verification limit

The overlay-based fullscreen startup trial failed again while the operator
explicitly left the desktop untouched. Unexpected idle resets therefore do not
establish external input or operator interference. The wall briefly activated,
macOS restored Chrome as foreground, and the wall correctly closed. This rules
out treating the shutdown itself as failed departure handling.

The current trial uses native fullscreen and deliberately enters a dedicated
wall Space. Its CI contract first establishes a separate app's native fullscreen
Space, starts the production wall, verifies sustained focus, transfers focus
within the wall app, then returns to the fullscreen fixture and verifies wall
closure. This fixture establishes window/Space behavior, not Chrome video or
physical keyboard acceptance. Wait for current-head results before claiming a
pass; do not reuse an earlier overlay contract result for this trial.

## Evidence reuse

| Fact or check | Evidence | Reopen when |
| --- | --- | --- |
| Playback origins share the departure and Escape rules | `main.test.js` exercises both origins and all three platform branches | Window lifecycle, input handling, or platform events change. |
| Internal window focus is not app departure | Integration tests and the real Electron desktop contract | Event mapping, window topology, Electron, or OS changes. |
| Initial activation, native app deactivation, and teardown work on macOS | `pnpm test:desktop` launches the production entrypoint and a task-owned second process | Relevant source, Electron, or macOS changes. This is not physical Command-Tab proof. |
| Lock/sleep closes playback and wake does not restore it | Session/policy tests and Electron contract with synthetic power events | Session mapping or close/startup logic changes; real lock/lid acceptance remains separate. |
| Exit and final session unblock require fresh idle | Policy/main tests with controlled clocks | Idle clock, stop semantics, or session mapping changes. |
| Camera default/opt-out and absence of media delays remain | Unchanged settings/activity source and main integration tests | Settings normalization or activity detection changes. No repeated camera/audio matrix for this lifecycle change. |
| Catalog, transcript, themes, and renderer remain unchanged | Source diff against the PR's prior head | Corresponding renderer/model source changes. No repeated model/theme visual matrix for this lifecycle change. |

Old presentation-mask, coverage, and recovery tests are superseded rather than
carried forward as proof of the new design. A previous 85-test refactor and
100,000-transition differential run verified preservation of the old policy;
they do not verify this intentional behavior change. Current-head CI still
runs lint, Svelte, tests/build, the native activity build, real desktop lifecycle
contracts, and the existing Electron security contracts.

Do not repeat a verified check for a wording-only edit, a resumed chat, or
unchanged component. Reopen it for a changed contract/runtime/environment,
contradictory evidence, or a required final delivery check. Single-display and
synthetic event results do not establish physical multi-display, keyboard,
authentication, or Windows/Linux desktop behavior.
