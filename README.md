# Fake Agent Wall

A wall of nine Claude Code sessions, all of them working, one of them on air.
None of it is running. Every repository, diff, token count and timing on screen
is invented.

It exists to be filmed. Put it on a laptop, run it full screen, and it looks
like a room full of machines doing serious work behind whatever you are actually
recording.

[Open the web version](https://vdustr.dev/fake-agent-wall/) ·
[Download for macOS, Windows or Linux](https://github.com/VdustR/fake-agent-wall/releases/latest)

![The wall: a program monitor on the left, a 3x3 grid of agent sessions on the right, a bus meter bridge below and a scrolling log along the bottom](docs/wall.png)

## What is real and what is not

| Real | Invented |
| --- | --- |
| The transcript grammar: `⏺` tool bullets, the `⎿` result gutter, right-aligned diff line numbers, `☒`/`☐` todos, the `(N tool uses · Nk tokens · Nm Ns)` subagent summary, execution-policy mode lines, permission prompts | Every repository, branch, file path, diff hunk, test result and benchmark |
| The 215 spinner verbs, read out of an installed Claude Code binary with `strings` and written to `src/lib/verbs.ts` | Every token count, context percentage, call rate and timecode |

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

*Keep display awake* runs *While playing* by default. Set it to *Always* and the
app becomes a plain caffeine switch. Set it to *Never* and it leaves power
management alone.

### Themes

Press <kbd>Command</kbd> + <kbd>Shift</kbd> + <kbd>,</kbd> on macOS or
<kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>,</kbd> on Windows and Linux to open
the theme panel. The shortcut works in both the desktop app and the web version.

Search the bundled iTerm presets, select one, and adjust any of its background,
foreground, cursor, selection, or 16 ANSI colours. Changes preview immediately.
New installations start with **Claude Dark**. The former Swarmdeck default and
its v1 stored selection are removed; choices applied from this version onward
persist normally.
**Reset preset** restores the selected preset, while **Cancel** or Escape returns
to the last applied theme. **Apply** saves the palette and separate UI/code font
families in local browser storage and restores them on the next launch. Font
families must already be installed on the computer; every value falls back to
`ui-monospace, monospace`.

The 533 converted presets come from
[`mbadolato/iTerm2-Color-Schemes`](https://github.com/mbadolato/iTerm2-Color-Schemes)
through [`VdustR/term-ptt-custom-theme`](https://github.com/VdustR/term-ptt-custom-theme).
The palette collection is MIT; individual scheme rights belong to their original
authors. See [Third-Party Notices](THIRD_PARTY_NOTICES.md). Fake Agent Wall does
not import or export `.itermcolors` files.

Stopping the wall takes Escape pressed twice within 1.5 seconds. Nothing else
interrupts it. Moving the mouse or pressing Escape once raises a hint plate
showing the way out, and every other key is swallowed. That gesture lives in the
Electron main process, so double-tapping Escape still quits even if the page has
wedged.

### Limits worth knowing before you file a bug

- macOS gets both Apple silicon and Intel builds; Windows gets x64 and arm64;
  Linux is x64 only.
- The wall opens on whichever display holds the pointer. Other displays are left
  alone.
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

## One known rendering hack

`⎿` (U+23BF) is the result gutter Claude Code prints, and no monospace face on
macOS carries it. They all fall back to a double-width box that breaks column
alignment. `src/app.css` borrows the glyph from a symbol face for that one
codepoint:

```css
@font-face {
  font-family: 'GutterMark';
  src: local('Apple Symbols'), local('Segoe UI Symbol'), local('DejaVu Sans Mono');
  unicode-range: U+23BF;
}
```

A machine carrying none of those three shows a tofu box on every gutter line.
The fix is to subset a symbol face down to U+23BF alone and ship it, a few
hundred bytes. Substituting `└` looks close and is the wrong character.

## Licence

MIT. See [LICENSE](LICENSE).

Not affiliated with Anthropic. Claude and Claude Code are their trademarks; this
repository imitates the terminal output for a stage prop and ships none of their
code.
