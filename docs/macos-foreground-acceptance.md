# macOS foreground and player acceptance

## Problem and behavior

An operator reported that video kept playing while the wall blocked player
interaction. Holding Escape still stopped the wall. The exact window ordering
in that report has not been independently reproduced.

The wall now checks native foreground, visibility, and input focus before
restricting input or recovering focus. Manual and automatic playback share
those restrictions. Startup origin determines what happens after background
playback and when automatic startup is allowed.

| Situation | Expected behavior |
| --- | --- |
| A visible wall has foreground input focus | Manual and automatic playback restrict app switching and hiding. Hold Escape for at least 1.2 seconds, then release to stop. |
| Another app takes the foreground, or the wall is fully occluded | Release presentation restrictions and input interception. Do not activate the wall over another app after startup recovery has completed. |
| Manual wall stays in the background | Keep it open with restrictions paused. Returning to a visible foreground key wall restores restrictions; explicit Dock activation can restore an occluded wall. |
| Automatic wall stays in the background for at least 300 ms | Stop it and wait a complete idle interval before starting again. A shorter interruption does not stop playback. |
| Screen lock, sleep, or inactive login session | Release restrictions and block recovery. Background samples do not stop playback. |
| Unlock or active session resumes | Allow focus recovery for up to one second. A confirmed visible foreground key wall ends that interval early. A delayed resume does not extend it. |

Audio and fullscreen applications do not delay startup. Their settings and
native detection are removed. Older settings are ignored and dropped during
normalization. The camera safeguard remains enabled by default, with an opt-out.

Watching video can therefore be interrupted by an automatic wall. Command-Tab
is restricted while the wall has foreground input focus; hold and release
Escape to return to the player. The wall does not pause or control media.
Volume, mute, brightness, screen locking, sleep, and system Force Quit remain
available. Windowed development mode does not impose these restrictions.

## Native state and timing

The native addon reads the live BrowserWindow's `NSWindow.occlusionState`, key
status, `NSApplication.isActive`, and `NSWorkspace.frontmostApplication` in the
main process. It also reads WindowServer window order, bounds, and window alpha.
A window alpha of one, a layer at least as high as the wall, and bounds
containing the entire wall mark it as covered. Lower-layer system transition
surfaces can precede the wall in the list and must not count as covers. Missing
wall metadata also releases restrictions. No window names or
pixels are inspected, and no input monitoring or screen recording permission
is added.

Samples run every 150 ms while playing and on focus, blur, key input, and
session changes. Recovery rechecks native state immediately before activation
because blur can precede the workspace's foreground change. Restrictions
release when the changed state is detected; the 300 ms background duration is
a minimum, with additional sampling latency.

Chromium visibility is unsuitable because `backgroundThrottling: false` can
keep an occluded renderer's visibility state at visible. On the test device,
AppKit also reported a visible wall beneath a full-display window. WindowServer
metadata therefore supplements AppKit. This detects one window covering the
entire wall; it does not combine partial windows or inspect per-pixel opacity.
A full-display window with transparent content and window alpha of one also
releases restrictions. Partial overlays remain outside this coverage check. Mission Control, Spaces gestures,
Spotlight, and custom shortcuts are outside the presentation guard's scope.

Sources: [Electron native window handles](https://www.electronjs.org/docs/latest/api/base-window#wingetnativewindowhandle),
[Apple window occlusion](https://developer.apple.com/documentation/appkit/nswindow/occlusionstate-swift.property),
[Apple foreground application](https://developer.apple.com/documentation/appkit/nsworkspace/frontmostapplication),
[Electron page visibility](https://www.electronjs.org/docs/latest/api/browser-window#page-visibility),
and [Apple window metadata](https://developer.apple.com/documentation/coregraphics/cgwindowlistcopywindowinfo(_:_:)).

## Automated verification

Policy and production-entrypoint tests cover both startup origins: foreground
restrictions, background input release, Escape across sampling, unlock before
delayed resume, automatic teardown and restart, and explicit Dock activation.
They also cover camera deferral/opt-out and obsolete media settings. Electron
and native surfaces are mocked in the integration tests.

The macOS Electron smoke checks real presentation flags, hidden-window state,
reacquisition, full-display coverage, partial overlays, and restoration after
fullscreen teardown. It does not establish physical key behavior or post-authentication focus. Earlier development traces
used different automatic switching behavior and do not establish acceptance
for this design.

## Device verification completed by the agent

On 2026-10-03, the production entrypoint ran with isolated manual and automatic
profiles on the operator's Mac. Native samples and real system idle time were
recorded. No idle clock or production foreground policy was mocked.

- Both startup origins enabled native process-switching and hiding restrictions
  while the wall had visible foreground input focus.
- Chrome foreground activation released manual restrictions without closing the
  wall or recovering focus over Chrome. The automatic wall closed about half a
  second after Chrome activation. A looping HTML5 sample video continued playing.
- A separate nonactivating full-display window reproduced an AppKit visibility
  failure. Before the WindowServer check, a covered wall could remain guarded after startup.
  With the fix, the same foreground key wall released restrictions when covered.
  Manual playback stayed open and restored restrictions after cover removal.
  Automatic playback released restrictions and closed after sustained coverage.
- A real one-minute interval passed after automatic background teardown before
  restart. The native smoke also verified that a small overlay preserves wall
  visibility and that removing full coverage restores it.

Chrome activation used the browser developer interface. Browser accessibility
controls can operate behind the wall, and tool-generated shortcuts did not reset
the system idle clock. These results prove native state transitions, not physical
keyboard routing, pointer reachability, or the operator's original player case.
The sample video does not establish audible-media behavior. Physical Command-Tab,
held Escape, hardware overlays, lid wake, and authenticated unlock remain pending.

## October 20 agent acceptance

The production entrypoint ran on macOS 26.6.2 (25G83), Electron 43.5.0, with
one 1680 × 1050 display at scale 2 and an isolated profile. Installed v0.13.0
and its settings were not replaced. The starting PR source was
[the lifecycle refactor](https://github.com/VdustR/fake-agent-wall/commit/09f9da5633eca9d0275ea030406fdd1c2c5e7d82).
The native layer correction is identified by blob
`ae9716fa8b49cecb01058e47272b81714d6feca8`.

| Check | Result and limit |
| --- | --- |
| System-level short and held Escape | A 196 ms hold kept the manual wall open. Holds of 1,606 ms and 1,580 ms closed it after keyup and restored presentation options to zero. Global event synthesis reset real OS idle and was observed independently in Electron input events; this is stronger than an app-targeted key, but remains synthetic input. |
| Sample-player controls | Global coordinate clicks paused, resumed, and sought a separate Electron player and a Chrome 155.0.8059.85 player. In Chrome after wall exit, the first click activated the inactive player; subsequent clicks paused, sought exactly +2 seconds, and resumed. Fresh AX bounds supplied coordinates; no background AX button action counted as pointer proof. |
| Escape leakage | The full-screen sample player stayed full-screen after wall exit and recorded no Escape. Both muted Chromium samples paused themselves while occluded and resumed when revealed; this does not establish uninterrupted or audible media in the original player. |
| Real idle startup and exit | The automatic wall started at 60–62 seconds of real OS idle with the one-minute setting; no fake idle clock or startup callback was used. With the layer correction, Command-H did not hide the automatic wall; a subsequent 1,598 ms Escape hold closed it on release and restored options to zero. |
| Dock transition metadata | Synthetic Command-Tab exposed a full-display Dock surface at layer 20 ahead of a wall at layer 101. The geometry-only check released restrictions and closed the automatic wall. Layer filtering prevents that false coverage without excluding Dock by name or changing background policy. |
| Native coverage and restoration | After the layer correction, the standalone native smoke passed flags, restoration, full coverage, lower layers, and partial overlays. An initial run concurrent with a guarded candidate failed restoration; that overlapping run was invalid and is not a pass. |
| Synthetic Command-Tab followed by Escape | Still inconclusive: both manual and automatic walls retained foreground/guard state with the layer correction, but the first synthetic Escape sometimes did not reach it; a later hold did. Do not equate native flags or accepted tool dispatch with physical shortcut acceptance. |

The layer condition follows [Apple window levels](https://developer.apple.com/documentation/appkit/nswindow/level-swift.property)
and [window-layer metadata](https://developer.apple.com/documentation/coregraphics/kcgwindowlayer).
It does not solve per-pixel transparency at the same or a higher layer. The
alternative of excluding a named system app would add an app-specific exception;
removing coverage checks would reopen the demonstrated full-cover failure.

No screen pixels were captured: the capture host rejected ownership because an
existing owner had no reachable socket. AX-only observation and independently
logged native/input/player state remained available. Volume/brightness key
names were rejected before dispatch by the tool. Actual hardware controls,
authenticated unlock, lid wake, and the original player remain physical checks.

## Physical acceptance

Review the [lifecycle design and evidence ledger](macos-wall-lifecycle.md) first.
Use the final PR head with an isolated profile and one-minute idle. Keep the
installed app/settings unchanged. Do not start another physical run while
implementation or current-head checks remain open.

Run these three representative groups after the final checks:

| Group | Steps | Expected result and observations |
| --- | --- | --- |
| Automatic startup and original player | Play video in the originally affected player; wait for idle startup. If the wall becomes visible, try Command-Tab, volume/mute, then hold Escape for at least 1.2 seconds and release. Pause/play and seek in the revealed player. If video stays in front, operate its controls directly. | A foreground wall restricts switching; hardware controls work; Escape closes on release. A foreground player remains usable without focus recovery over it. Record player/fullscreen mode and whether any click was needed. |
| Manual lock/unlock | Use Play now, lock, authenticate, wait one second, then hold/release Escape without clicking. | The wall closes on the first full hold. Escape must not reach or exit fullscreen in the revealed player. Record authentication method or any extra click/delay. |
| Automatic lid wake | Let idle start the wall, close/reopen the lid, authenticate, wait one second, then use the same Escape gesture without clicking. | The lock screen stays usable; the wall recovers after authentication and accepts the first full hold. No leaked Escape or extra click. |

This samples both startup origins and both real wake mechanisms. Automated
production-entrypoint tests cover the remaining origin/event-order combinations.
Shared hardware-control checks need one representative run, not a repeat for
every origin. Do not time another idle restart interval; that timing is covered
by the recorded device observation and the current policy/integration checks.

If a group fails, record that result and reopen only the affected rule and
relevant origin/event combinations. Stop the test instance before continuing;
the tray Stop/Quit action or system Force Quit is the fallback. Do not grant
new permissions, replace the installed app, or count a tool-generated key as
physical acceptance.

Keep this PR Draft until these groups pass. Multi-display behavior and other
untested environments remain unverified. Merge, release, and installation stay
gated on acceptance; CI is not proof of post-authentication keyboard routing.
