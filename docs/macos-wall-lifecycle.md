# macOS wall lifecycle design and evidence

Updated October 17, 2026 (Asia/Taipei). This records the scope of the lifecycle
refactor in the [foreground restrictions PR](https://github.com/VdustR/fake-agent-wall/pull/62).
The [physical acceptance procedure](macos-foreground-acceptance.md#physical-acceptance)
is the remaining operator gate.

## Outcome and fixed behavior

The wall must accept Escape when it owns the visible foreground, release
restrictions when it does not, and avoid recovering over another app after its
bounded startup or unlock interval. This refactor changes state ownership,
not those rules.

| Condition | Preserved result |
| --- | --- |
| Visible, uncovered, foreground key wall | Both startup origins restrict switching/hiding and accept the same Escape gesture. |
| Another app is foreground or the wall is covered | Release restrictions and cancel stale Escape input. Do not recover focus after the bounded recovery interval. |
| Manual playback remains in the background | Keep it open; restore restrictions when it is visible and focused again. |
| Idle playback remains in the background | Close after 300 ms of sustained background, with 150 ms sampling latency; wait the configured idle interval before restarting. |
| Lock, sleep, or inactive login session | Release restrictions, cancel pending recovery/input, and keep the wall open. |
| Final session block clears | Permit recovery for at most 1,000 ms; confirmed foreground ends recovery early. |
| Unlock arrives before delayed resume | Unlock supersedes the sleeping/locked blocks. An inactive login session still blocks recovery. A later resume does not extend recovery. |

Escape is armed after 1,200 ms and closes the wall only after its keyup is
consumed. Audio/fullscreen startup deferral stays removed. Camera protection,
its opt-out, native presentation options, window geometry/coverage, settings,
and rendering stay unchanged. No additional dependency or media heuristic is
introduced by the refactor.

## Alternatives and decision

| Approach | Benefit | Cost or boundary | Decision |
| --- | --- | --- | --- |
| Keep separate playback/session state in the main process, focus guard, and policy | Smallest immediate diff | Requires ordered synchronization and duplicates decisions | Reject for the requested refactor. |
| Make the existing playback policy authoritative; derive permissions and schedule focus separately | Removes duplicate state and the synchronization workaround | Requires regression coverage of session events and lifecycle wiring | Select. |
| Replace the lifecycle with a state-machine library, unify startup-origin behavior, or remove native polling | Could support broader changes | Adds a dependency or changes user behavior; event-only coverage is not established | Defer. Outside this refactor. |

The selected approach follows the established practice of [keeping state minimal
and deriving other values](https://redux.js.org/usage/deriving-data-selectors#deriving-data),
without introducing Redux. [Electron 43.5 power events](https://github.com/electron/electron/blob/v43.5.0/docs/api/power-monitor.md)
define event meanings, not the relative order of unlock and resume. Preserve the
observed event-order regression instead of assuming a different platform order.

| Responsibility | Owner |
| --- | --- |
| Playback source and whether playback exists | `createPlaybackPolicy`; `main.js` reads `isPlaying()` instead of storing another boolean. |
| Lock/sleep/login-session blockers and derived session availability | The same policy; no mirrored session-active boolean in another module. |
| Native power-event mapping | `observeSessionFocus`; finish the event's policy changes before notifying the caller once. |
| Delayed focus action, cancellation, and application-before-window activation | `createFocusGuard`; permission is supplied by the caller, with no session state of its own. |
| Native samples, input, window creation/destruction, and tray/power effects | `main.js`; reads the policy and performs side effects. |

## Evidence reuse rules

A historical observation remains a fact about its recorded environment. It is
not a permanent guarantee for other code, runtimes, operating systems, or
hardware. Reuse a result only while its relevant assumptions still hold.

The [pre-refactor source](https://github.com/VdustR/fake-agent-wall/commit/b9f3710b3ca761fbd89b6895d7596be72d23b612)
used Electron 43.3.0. The [upstream security/release baseline](https://github.com/VdustR/fake-agent-wall/commit/418d3269d23206b305f2cffa4c960b0dec999c3d)
uses Electron 43.5.0 and Vitest 4.1.11. It was merged before this refactor.
Runtime-dependent native results must therefore be refreshed in CI even when
the native source is identical.

| Fact or observation | Evidence and scope | Reopen only when |
| --- | --- | --- |
| Model labels and Luna decisions are a client-side simulation; no provider integration is added here | `corpus.ts`, `transcript.ts`, and [decision routes](decision-routes.md); source unchanged from the pre-refactor source | Catalog/transcript/API boundaries change. No operator retest for lifecycle-only changes. |
| Manual and automatic playback share the input/guard predicate | `playback-policy.test.js` and `main.test.js`, including both origins | Input permission, origin handling, or native sampling changes. |
| Unlock can precede resume and must clear the prior sleep block | [October 2 laptop acceptance](macos-unlock-acceptance.md#historical-device-evidence); regression sequences in `main.test.js` | Session mapping, recovery ownership/order/timing, Electron, macOS, or authentication environment changes. This refactor and runtime update reopen representative wake acceptance. |
| A fully covered window can still be reported visible by AppKit | [October 3 device record](macos-foreground-acceptance.md#device-verification-completed-by-the-agent); native coverage smoke | Native window implementation, Electron, macOS, or display arrangement changes. The old raw temporary traces are unavailable; do not present this as a new reproduction. |
| Presentation flags preserve Force Quit and session termination and restore prior options | `presentation-guard.mm` and `presentation-guard-smoke.cjs`; source identity below | Native source, window teardown/reconciliation, Electron, or macOS changes. Re-run CI native smoke for the runtime update; physical routing is separate. |
| Small overlays do not count as a full-window cover; a full-size window with window alpha one does, even with transparent content | Native smoke and coverage implementation; no per-pixel opacity or union of partial windows | Coverage geometry/alpha rules or runtime/display environment changes. Do not claim pixel-perfect detection. |
| An automatic background teardown waits a complete configured idle interval before restart | October 3 one-minute record and policy/main clock tests | Idle clock, background teardown, or startup scheduling changes. This refactor rechecks policy/main tests; no extra operator stopwatch exercise is required. |
| Camera protection remains enabled by default with an opt-out; audio/fullscreen deferral remains absent | Settings/activity source plus integration tests | Settings normalization or activity detection changes. No operator camera/audio matrix for this refactor. |

### Source identity for unchanged components

These are Git blob IDs from the pre-refactor source and were compared with the
refactor working tree on October 17. They identify source equality, not binary
or runtime equivalence. Compare with `git hash-object <path>` when deciding
whether a code-specific check needs reopening.

| File | Git blob |
| --- | --- |
| `desktop/native/presentation-guard.mm` | `45cad214cdaf46be50f58cfe075653861e67e2e2` |
| `desktop/presentation-guard-smoke.cjs` | `1b2fac2fa76a097268ef348acca92037b6ecd8b6` |
| `desktop/system-controls.js` | `edaa5293d6331137923124271275cfc8fb957138` |
| `desktop/native/activity-monitor.swift` | `e1f7020753262ab132b45e05d4aaa334d55f71e0` |
| `src/lib/corpus.ts` | `0bbe527a63a647f7833ebc088f44c7518d9b118d` |
| `src/lib/transcript.ts` | `3c940d7ef1523da166b4dbe9d40f857210029c07` |

## Refactor verification

- Targeted tests exercise both origins, pending recovery cancellation, resume
  before unlock, unlock before delayed resume, inactive login sessions, stale
  Escape release, observer cleanup, and non-macOS Escape exit. Session tests now
  run through the authoritative policy and production entrypoint rather than a
  second implementation inside the focus guard. Electron/native surfaces are
  mocked; Windows/Linux cases exercise platform branches, not physical devices.
- A one-off deterministic comparison against the pre-refactor policy exercised
  200 traces and 100,000 transitions, including 154 automatic teardowns. Seed:
  `20261017`. Start/stop, recovery requests, reordered power events, native-state
  samples, guard/input/recovery decisions, and idle-clock results matched. This
  compares pure policy outputs, not WindowServer behavior or physical input.
- Local lint, Svelte checks, all 85 tests, and the web build passed on October
  17 with Node 26.12.0 and Vitest 4.1.11. Lint retains five upstream
  `no-await-in-loop` warnings in the security fixture; this refactor adds none.
  Current-head CI is recorded in the PR. Required CI
  still runs the repository-wide suite and native/security smoke; an unchanged
  component does not waive required delivery checks.
- Operator acceptance remains pending. Use the three representative groups in
  the acceptance procedure. Do not repeat every origin/environment combination
  unless a failure or new change identifies that combination as distinct.

Do not reopen a completed check for a wording-only change or merely because a
new chat starts. Reopen its affected scope for a changed source contract,
runtime/environment change, contradictory evidence, or required final delivery
check. Multi-display and untested authentication methods remain explicitly
unverified; they are not established by single-display or mocked tests.
