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
A window alpha of one and bounds containing the entire wall mark it as
covered. Missing wall metadata also releases restrictions. No window names or
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

## Physical acceptance

Use an isolated profile and test the current PR head. Keep the installed release
and its settings unchanged. Record the player, fullscreen mode, and each result.

1. **Automatic startup and exit:** use one-minute idle with the camera inactive.
   Play video and wait for actual idle startup. Command-Tab must be restricted
   while the visible wall has focus. Hold Escape for at least 1.2 seconds and
   release; the player must then support pause/play, seeking, and shortcuts.
2. **Foreground player:** reproduce the original situation where video is
   visible in front of the wall. Player controls must work without the wall
   pulling focus back. An automatic wall must stop; a manual wall must release
   its restrictions. Do not use Command-Tab as the way to reach this state.
3. **Lock and lid wake:** test manual and automatic playback. Lock, unlock,
   wait one second, and do not click. Hold and release Escape to stop. Repeat
   after closing and reopening the lid. Escape must not reach the revealed player.
4. **Hardware controls:** test both startup origins. Volume/mute must work;
   their overlay must not permanently stop playback or leave input blocked.
   Stopping the wall must restore app switching. The agent has verified the complete idle interval after automatic
   background teardown; the operator does not need to time it again.

Physical acceptance remains pending, including multi-display behavior. Keep the
PR Draft until the operator's player and wake tests pass. CI and native flag
readback cannot establish WindowServer behavior after authentication. Do not
merge, release, or replace the installed app before acceptance passes.
