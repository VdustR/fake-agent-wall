# Electron 43.8.1 acceptance

This record reopens only the runtime-sensitive gates from the
[lifecycle evidence-reuse policy](macos-wall-lifecycle.md#evidence-reuse).
It supplements, rather than replaces, the source-pinned physical observations
in [playback acceptance](macos-foreground-acceptance.md).

## Source and environment

The [Electron upgrade PR](https://github.com/VdustR/fake-agent-wall/pull/82)
was accepted at [candidate 1b038517](https://github.com/VdustR/fake-agent-wall/commit/1b03851716290e31c3064660214892dbd15fdedf)
on October 26, 2026, using macOS 26.6.2 (25G83), ARM64, Electron 43.8.1,
and an isolated profile. The observer loaded the unchanged production desktop
entrypoint and built renderer. It recorded window lifecycle and input events;
it did not replace focus, permission, login, or input-handling APIs.

The [candidate CI](https://github.com/VdustR/fake-agent-wall/actions/runs/40261300558)
passed both `verify` and `native-macos`. The first native attempt failed a cursor
assertion; one rerun of the same source/runtime passed. This establishes an
intermittent result, not a diagnosed or repaired cause.

## Observations

All trace times below are UTC on October 26, 2026. The operator explicitly left
the desktop untouched and authorized foreground automation. Keyboard events
were global synthetic OS input, not physical human keyboard input.

| Check | Observation |
| --- | --- |
| Native fullscreen entry | The first wall entered fullscreen at 04:19:20.364 and remained visible and focused in the subsequent snapshot. |
| Theme cancellation | The actual shortcut opened theme settings. A draft label was entered, short Escape closed the panel, and reopening showed the original `fake-agent-wall` label. Theme storage remained unset. Playback stayed active. |
| Return to Chrome | Native Chrome activation produced app deactivation at 04:22:40.275; the wall closed at 04:22:42.253. The subsequent snapshot contained no walls. |
| Held Escape | The second fullscreen wall received keydown at 04:26:28.031 and keyup at 04:26:29.529, a 1,498 ms hold. It closed at 04:26:30.658; the subsequent snapshot contained no walls. |
| Player state and controls | The controlled Chrome video retained HTML fullscreen and recorded zero Escape events. After return, Pause worked, Seek set the paused position to exactly 6 seconds, and Play resumed beyond 6 seconds. |

The initial video fixture omitted HTTP Range support: its seekable range ended
at zero and seeking reset the position. Adding correct byte-range responses to
the fixture established a 12-second seekable range and restored seeking. No
product change was made for this fixture failure.

## Evidence limits and reuse

Synthetic Command-Tab did not commit an OS application switch. App departure
was therefore verified through native application activation; this is not a new
physical Command-Tab pass. The controlled video was muted. These observations
do not establish uninterrupted audible playback, the operator's original
player, hardware controls, lock/lid wake, multi-display behavior, or Windows/Linux
desktop behavior. Existing physical observations remain pinned to their original
source and runtime; they are not relabeled as Electron 43.8.1 evidence.

The read-only browser DOM sandbox reported `fullscreenElement` as absent while
the page's own fullscreen-change telemetry and visible accessibility status
reported fullscreen. The fullscreen conclusion uses the latter observations.
Raw lifecycle, input, player, and snapshot evidence was retained in the local
audit continuation; personal paths and user profile data are not published here.

Reopen these targeted checks when Electron, macOS, Chrome, or the relevant
window/input/renderer source changes, or when contradictory evidence appears.
Documentation and release-metadata edits alone do not invalidate them. Published
assets and the installed app still require separate version, architecture,
signature, digest, and profile-preservation readback.

## Dependency boundary

The tested Electron process reported Node 24.22.0 and bundled undici 7.29.1.
An npm override cannot replace undici embedded in Node. This version observation
does not prove whether an upstream backport addresses an advisory; that requires
vendor-source evidence. The no-patch `http-cache-semantics` advisory is also a
separate custody item. Neither is declared fixed by the foreground acceptance.
