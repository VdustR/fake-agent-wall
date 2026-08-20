# Fake Agent Wall

Fake Agent Wall is a responsive ambient display of synthetic coding-agent
activity. Run it full-screen as a video or livestream backdrop, a presentation
prop, or a screensaver-like display while your computer is idle.

Its layout and source count adapt from compact windows to ultrawide screens.
Every session, task, diff, provider route and metric is simulated.

[Open the web version](https://vdustr.dev/fake-agent-wall/) ·
[Download for macOS, Windows or Linux](https://github.com/VdustR/fake-agent-wall/releases/latest)

![The wall: a program monitor, dynamically packed agent sessions, task and usage panels, and a live swarm bus](docs/wall.png)

## Responsive wall

The wall is a content-aware mosaic rather than a fixed grid. JavaScript measures
the available container, selects how many blocks can remain useful, and packs
each type around its preferred size and aspect ratio. PGM stays prominent
without growing indefinitely; horizontal telemetry, vertical task and usage
panels, and terminal feeds are allocated differently. On very large viewports,
the simulation generates additional agents instead of stretching a small fixed
set across empty space.

Each synthetic agent also varies its work profile, transcript density, typing
tempo, todos, permission prompts, provider, model, token use and context state.
Resizing or browser zoom therefore changes both the composition and the amount
of simulated activity while preserving the broadcast hierarchy.

## What is real and what is not

| Real | Invented |
| --- | --- |
| Familiar engineering structures: tool calls, result gutters, diffs, todos, task summaries, execution policies and permission prompts | Every repository, branch, file path, diff hunk, test result and benchmark |
| A consistent agent grammar shared across simulated providers | Every token count, context percentage, call rate and timecode |

Nothing on this page measures anything. Do not present a number from it as a
real metric.

## Installing

Builds are unsigned, so every platform challenges them on first launch.

**macOS.** The app is ad-hoc signed: the signature is valid, it just belongs to
no registered developer. Move `Fake Agent Wall.app` to `/Applications`, open it
once, then go to System Settings → Privacy & Security and press Open Anyway. Or
skip the round trip:

```bash
xattr -dr com.apple.quarantine "/Applications/Fake Agent Wall.app"
```

A build that says "damaged and can't be opened" instead of naming an unverified
developer has a packaging bug rather than a corrupt download. Please open an
issue if you see that.

**Windows.** SmartScreen shows "Windows protected your PC". Choose More info,
then Run anyway.

**Linux.** `chmod +x` the AppImage, or install the `.deb`.

## The app

Opening the app plays the wall. That is the whole launch path. Closing the wall
leaves the app in the menu bar, where the icon plays and stops on left click and
opens the settings menu on right click.

It can also start itself once you walk away. Turn on *Start when idle* and pick
an interval between 1 and 60 minutes. The app reads the system-wide idle time,
so it counts the whole Mac sitting untouched rather than just this app.

On macOS, *Delay automatic start while* can keep the wall out of the way while
the camera is in use or another app is full screen. Both safeguards are on by
default. Audio playback is available as a separate opt-in safeguard, so music
can continue behind the wall without preventing it from starting.

*Keep display awake* runs *While playing* by default. Set it to *Always* and the
app becomes a plain caffeine switch. Set it to *Never* and it leaves power
management alone.

### Wall settings

Press <kbd>Command</kbd> + <kbd>Shift</kbd> + <kbd>,</kbd> on macOS or
<kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>,</kbd> on Windows and Linux to open
the settings panel. The shortcut works in both the desktop app and the web version.

The **Wall label** field customizes the bracketed session name at the top-left of
the display. Brackets are added automatically and labels are limited to 32
characters so the status line remains usable on narrow screens.

Search the bundled iTerm presets, select one, and adjust any of its background,
foreground, cursor, selection, or 16 ANSI colours. Changes preview immediately.
New installations start with **Catppuccin Mocha**, **Monaspace Xenon** for
master-control chrome, **Monaspace Neon** for terminal content, and **Instrument
Serif** for editorial text. Existing saved choices continue to load normally.
**Reset preset** restores the selected preset, while **Cancel** or Escape returns
to the last applied theme. **Apply** saves the palette and separate UI/code font
families in local browser storage and restores them on the next launch. The
three defaults are bundled; custom font families must be installed on the
computer and always fall back to system faces.

The 533 converted presets come from
[`mbadolato/iTerm2-Color-Schemes`](https://github.com/mbadolato/iTerm2-Color-Schemes)
through [`VdustR/term-ptt-custom-theme`](https://github.com/VdustR/term-ptt-custom-theme).
The palette collection is MIT; individual scheme rights belong to their original
authors. See [Third-Party Notices](THIRD_PARTY_NOTICES.md). Fake Agent Wall does
not import or export `.itermcolors` files.

Stopping the wall takes Escape held for 1.2 seconds. Nothing else interrupts it.
Moving the mouse or pressing several keys in quick succession raises a hint plate
showing the way out. Holding Escape fills its progress bar; releasing early cancels
the exit. Once the bar is full, the wall waits for Escape to be released before it
closes, so the application underneath never receives the held key. That gesture
lives in the Electron main process, so it still works if the page has wedged.

### Limits worth knowing before you file a bug

- macOS gets both Apple silicon and Intel builds; Windows gets x64 and arm64;
  Linux is x64 only.
- The desktop app opens one wall on every connected display. Each display runs
  an independent simulation and adapts to its own resolution.
- *Open at login* does nothing on Linux, where Electron does not implement it,
  and the menu hides it there.
- Moving the mouse does not dismiss it. This is deliberate: the wall is meant to
  survive someone walking past the laptop.

## Development

```bash
pnpm install
pnpm dev          # web version at http://localhost:5273
pnpm app:dev      # Electron shell against the dev server
pnpm app          # Electron shell against a production build
pnpm app:dmg      # macOS disk image into release/
pnpm app:windowed # the shell in a plain window, for debugging the kiosk
pnpm app:multi-display # two tiled windows, for multi-display logic without extra hardware
```

```bash
pnpm lint         # oxlint
pnpm check        # svelte-check
pnpm build        # static site into dist/
```

Svelte 5, Vite 8, oxlint, pnpm, Electron.

`desktop/after-pack.cjs` re-signs the macOS bundle ad-hoc. electron-builder
starts from Electron's own linker-signed binary, and repacking invalidates that
signature without removing it, which macOS reports as tampering. Re-signing
makes the signature match the bundle again.

`PRODUCT.md` records what the thing is for. `DESIGN.md` records the visual
system: a broadcast master-control multiviewer, where red is the program bus,
amber means a source is blocked on an operator, and green belongs to the preview
bus alone.

Releases are cut by [Release Please](https://github.com/googleapis/release-please)
from Conventional Commits on `main`. Merging its release PR tags the version,
publishes the release, and attaches a build for each platform.

## Licence

MIT. See [LICENSE](LICENSE).

Provider and model names shown by the simulation are illustrative. This project is
not affiliated with or endorsed by any provider, and ships none of their client code.
