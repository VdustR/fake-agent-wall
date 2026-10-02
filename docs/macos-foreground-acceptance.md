# macOS foreground and player acceptance

## Problem and scope

An operator reported that video continued playing while the wall prevented
player interaction. Holding Escape still stopped the wall. The exact player
window ordering in that report has not been independently reproduced.

The previous implementation applied presentation restrictions whenever the
wall was playing in an active login session. Window blur scheduled focus
recovery without checking the foreground application or occlusion. Idle
activity safeguards ran only before automatic startup.

This change separates automatic and manual playback and checks actual AppKit
state before imposing restrictions or recovering focus. Audio detection still
cannot distinguish music, video, and other sound. Its existing opt-in setting
is preserved; this change does not add media controls or pause a player.

## Behavior

| Situation | Expected behavior |
| --- | --- |
| Manual playback, visible foreground key window | App switching and hiding are restricted; holding and releasing Escape stops playback. |
| Manual playback, another foreground app or fully occluded wall | Presentation restrictions and input interception are released; recovery does not activate the wall over another app. |
| Return to a manual wall | Restrictions resume when a visible wall has foreground input focus. Explicit Dock activation can restore an occluded wall. |
| Automatic playback | App switching remains available. A background or fully occluded wall stops after 300 ms of consecutive background samples. |
| Automatic wall stops after foreground takeover | A full idle interval must pass again, even when the system reports a longer idle time. |
| Short foreground interruption | Restrictions release immediately on detection, but automatic playback does not stop unless the interruption persists for 300 ms. |
| Screen lock, sleep, inactive login session | Restrictions release and recovery is blocked; background samples do not stop playback. |
| Unlock or active session resumes | A bounded one-second recovery interval allows focus restoration. A confirmed visible foreground key window ends that interval early. A delayed resume does not extend it. |

Samples run every 150 ms while playing, and also on window focus, blur, key
input, and session changes. A blur recovery rechecks native state before
activating the app because blur can precede the workspace's foreground change.
Detection and automatic teardown therefore have sampling latency; 300 ms is
the minimum consecutive background duration, not a guaranteed response time.

The native addon reads the current window's `NSWindow.occlusionState`, key
status, `NSApplication.isActive`, and `NSWorkspace.frontmostApplication`.
It receives only live BrowserWindow handles in the main process. No input
monitoring or screen recording permission is added. Multi-display sampling
requires a visible key wall, rather than counting focus on a covered wall.

Sources:

- [Electron native window handle](https://www.electronjs.org/docs/latest/api/base-window#wingetnativewindowhandle)
- [Apple window occlusion state](https://developer.apple.com/documentation/appkit/nswindow/occlusionstate-swift.property)
- [Apple foreground application](https://developer.apple.com/documentation/appkit/nsworkspace/frontmostapplication)
- [Electron page visibility](https://www.electronjs.org/docs/latest/api/browser-window#page-visibility)

Chromium page visibility is unsuitable here because the wall sets
`backgroundThrottling: false`. An occluded renderer may still report visible.
Partial overlays that leave part of a wall visible are not classified as full
occlusion. Mission Control, Spaces gestures, and custom system shortcuts remain
outside the presentation guard's scope.

## Automated evidence

- Policy tests cover foreground restrictions, automatic app switching,
  persistent and transient background states, restart timing, and session
  recovery.
- Main-process integration tests execute the production entrypoint with mocked
  Electron/native surfaces. They verify Escape holds across sampling, background
  input release, automatic teardown and restart, a foreground transition between
  blur and recovery, Dock activation, and unlock before delayed resume.
- The Electron macOS smoke reads real AppKit presentation flags and hidden
  window state, validates automatic switching, and verifies restoration across
  fullscreen teardown. It does not verify physical keys or authentication.
- A local instrumented Electron run on October 2, 2026 observed automatic
  playback with presentation options `5`, foreground loss, and window closure
  415 ms after blur. Presentation options returned to `0`. Its idle clock was
  simulated; this trace does not prove real idle timing or player usability.

## Physical acceptance gate

Use an isolated test profile. Keep the installed release and its settings
unchanged until this gate passes. Test manual playback first, then automatic
playback. Do not use the synthetic dashboard's output as verification evidence.

1. **Manual exit and wake:** start the wall manually. Close and reopen the lid,
   unlock, wait one second, and do not click. Hold Escape for at least 1.2
   seconds, then release. The wall must stop without sending Escape to the
   revealed player. Repeat with screen lock without closing the lid.
2. **Player interaction:** reproduce the original foreground-player situation,
   including fullscreen video. Whenever the player is visible in front of the
   wall, pause/play, seeking, and normal player shortcuts must work. The wall
   must not pull focus back over the player. Record the player and fullscreen
   mode; a different player alone does not establish the reported case passed.
3. **Automatic playback:** set the isolated profile to one-minute idle and
   temporarily disable audio/fullscreen deferral. Wait for actual idle startup,
   use Command-Tab to return to the player, and verify the wall stops and player
   interaction works. It must wait another full minute before restarting.
4. **Manual restrictions and hardware controls:** start manually again. Confirm
   Command-Tab is restricted while the wall is visible and focused, volume/mute
   work, and holding/releasing Escape restores app switching. A volume overlay
   must not permanently stop playback or leave input blocked after it closes.

Record each result against the tested PR head. The new physical acceptance is
pending; the previous release's unlock acceptance does not cover this change.
Keep the PR Draft and do not merge, release, or install until the operator's
player and wake tests pass. Unit tests, native flag readback, and CI support the
implementation but cannot establish WindowServer behavior after authentication.
