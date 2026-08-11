---
name: Swarmdeck
description: A broadcast master-control multiviewer for a wall of Claude Code agent sessions.
colors:
  ink-000: "#08090a"
  ink-050: "#0d0f11"
  ink-100: "#131619"
  ink-150: "#1a1e23"
  ink-200: "#22272e"
  line: "#1e2329"
  line-hi: "#333b45"
  txt: "#c9d1d9"
  txt-dim: "#98a3af"
  txt-fnt: "#7d8792"
  umd: "#b6c0cb"
  txt-hi: "#e8eef4"
  on-live: "#ffffff"
  on-cue: "#04170c"
  on-coral: "#1a0d08"
  led-off: "#39434f"
  led-hot: "#ff7a5c"
  live: "#ff2b18"
  cue: "#17d76a"
  hold: "#ffab00"
  done: "#2f81f7"
  amber: "#ffb02e"
  coral: "#d97757"
  add: "#56d364"
  add-bg: "rgba(46, 160, 67, 0.15)"
  del: "#f8756c"
  del-bg: "rgba(248, 81, 73, 0.13)"
typography:
  display:
    fontFamily: "'Martian Mono', ui-monospace, monospace"
    fontSize: "clamp(17px, 2.05vw, 38px)"
    fontWeight: 700
    lineHeight: 1
    letterSpacing: "0.02em"
    fontFeature: "tabular-nums"
  headline:
    fontFamily: "'Martian Mono', ui-monospace, monospace"
    fontSize: "clamp(9.5px, 0.86vw, 15px)"
    fontWeight: 700
    lineHeight: 1
    fontFeature: "tabular-nums"
  title:
    fontFamily: "'Martian Mono', ui-monospace, monospace"
    fontSize: "clamp(11px, 1.02vw, 18px)"
    fontWeight: 700
    letterSpacing: "0.14em"
  body:
    fontFamily: "'GutterMark', 'Iosevka', ui-monospace, 'SF Mono', Menlo, monospace"
    fontSize: "clamp(9px, 0.67vw, 13px)"
    fontWeight: 400
    lineHeight: 1.44
  body-pgm:
    fontFamily: "'GutterMark', 'Iosevka', ui-monospace, 'SF Mono', Menlo, monospace"
    fontSize: "clamp(10.5px, 0.84vw, 16px)"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "'Martian Mono', ui-monospace, monospace"
    fontSize: "clamp(6.5px, 0.46vw, 9.5px)"
    fontWeight: 500
    lineHeight: 1
    letterSpacing: "0.1em"
rounded:
  none: "0"
  pill: "1px"
  panel: "2px"
  prompt: "4px"
spacing:
  gap: "clamp(5px, 0.5vw, 10px)"
  tight: "6px"
  strip: "10px"
  panel: "12px"
  rail: "0 clamp(8px, 0.8vw, 16px)"
  scale-gutter: "34px"
components:
  pgm-monitor:
    backgroundColor: "{colors.ink-000}"
    rounded: "{rounded.panel}"
  source-tile:
    backgroundColor: "{colors.ink-000}"
    rounded: "{rounded.panel}"
  terminal-field:
    backgroundColor: "{colors.ink-050}"
    textColor: "{colors.txt}"
    typography: "{typography.body}"
    padding: "0.5em 0.7em"
  terminal-status-bar:
    backgroundColor: "{colors.ink-000}"
    textColor: "{colors.txt-fnt}"
    padding: "0.35em 0.75em 0.45em"
  umd-strip:
    backgroundColor: "{colors.ink-150}"
    textColor: "{colors.umd}"
    typography: "{typography.label}"
    height: "clamp(16px, 1.5vw, 22px)"
    padding: "0 6px 0 0"
  umd-strip-pgm:
    backgroundColor: "{colors.ink-150}"
    textColor: "{colors.txt-fnt}"
    typography: "{typography.label}"
    height: "clamp(19px, 1.8vw, 28px)"
    padding: "0 10px"
  source-number-chip:
    backgroundColor: "{colors.ink-200}"
    textColor: "{colors.txt-hi}"
    typography: "{typography.label}"
    padding: "0 6px"
  tally-badge-air:
    backgroundColor: "{colors.live}"
    textColor: "{colors.on-live}"
    typography: "{typography.label}"
    padding: "3px 5px 3px 6px"
  tally-badge-preview:
    backgroundColor: "{colors.cue}"
    textColor: "{colors.on-cue}"
    typography: "{typography.label}"
    padding: "3px 5px 3px 6px"
  next-cut-plate:
    backgroundColor: "{colors.ink-200}"
    textColor: "{colors.umd}"
    typography: "{typography.label}"
    padding: "0 8px"
  next-cut-plate-cueing:
    backgroundColor: "{colors.cue}"
    textColor: "{colors.on-cue}"
    typography: "{typography.label}"
    padding: "0 8px"
  count-pill:
    backgroundColor: "{colors.ink-050}"
    textColor: "{colors.txt-dim}"
    typography: "{typography.label}"
    rounded: "{rounded.pill}"
    padding: "3px 6px"
  permission-prompt:
    backgroundColor: "color-mix(in oklab, #d97757 8%, #0d0f11)"
    textColor: "{colors.coral}"
    rounded: "{rounded.prompt}"
    padding: "0.5em 0.7em"
  rail:
    backgroundColor: "{colors.ink-150}"
    height: "clamp(42px, 4.4vw, 66px)"
    padding: "0 clamp(8px, 0.8vw, 16px)"
  ticker:
    backgroundColor: "{colors.ink-100}"
    height: "clamp(26px, 2.6vw, 42px)"
  ticker-tag:
    backgroundColor: "{colors.coral}"
    textColor: "{colors.on-coral}"
    typography: "{typography.label}"
    padding: "0 12px"
  telemetry-panel:
    backgroundColor: "{colors.ink-100}"
    rounded: "{rounded.panel}"
    padding: "8px 12px 7px"
  telemetry-header:
    backgroundColor: "{colors.ink-150}"
    textColor: "{colors.umd}"
    typography: "{typography.label}"
    padding: "5px 12px 6px"
  ppm-track:
    backgroundColor: "{colors.ink-050}"
    height: "clamp(9px, 0.95vw, 15px)"
  ppm-readout:
    textColor: "{colors.amber}"
    typography: "{typography.headline}"
---

# Design System: Swarmdeck

## Overview

**Creative North Star: "The Master Control Room"**

Swarmdeck is a rack-mounted broadcast multiviewer that happens to be showing agent
sessions instead of camera feeds. The governing idea is that many things working at
once is a broadcast problem, not a dashboard problem: a multiviewer already solves
"which of these nine is on air, which is queued, which needs me" with tally lamps,
UMD label strips and a program monitor, and this build adopts that object wholesale
rather than inventing a stats header. The surface is graphite, not black; hairlines
are silkscreened at exactly 1px; nothing floats.

Density is the message. Every panel is clipped, never scrolled, and every panel is
full at all times — a near-empty terminal on this wall would read as "nothing is
happening", which is the one thing the surface must never say. The chrome is
deliberately thin and small (labels bottom out at 6.5px) so that the transcripts
underneath keep the majority of the pixels. Read at a glance the wall answers "nine
sessions, all working, one on air"; read up close it answers with real Claude Code
transcript grammar — `⏺` tool bullets, `⎿` result gutters, right-aligned diff line
numbers, todo checklists, permission prompts, the accept-edits mode line.

Two constraints shape the palette beyond taste. The surface exists to be filmed, so
the ink ramp is graded for contrast that survives codec compression — the detail layer
is the first thing a codec eats. And every readout is measured against a printed fixed
scale rather than an auto-fitted one, because a bar that rescales itself measures
nothing. The world explicitly refuses three defaults: glow-on-black neon,
glassmorphism, and rounded cards. Colour is a signalling system with a fixed meaning,
not decoration; where the build wants emphasis it changes hue, never weight.

**Key Characteristics:**

- Graphite tonal layering (five ink steps) instead of shadow-based elevation, with exactly one recess on the whole surface.
- Hard 1px hairlines; corners at 2px or 0.
- Tally lamps as the primary status channel: red program bus, green preview bus, amber operator-blocked, blue idle.
- Two type families with strictly separated jobs: Martian Mono for chrome, Iosevka for transcript body.
- Instrument readouts on printed fixed scales: PPM bus meters with graticules, peak-hold caps, segmented LED ladders, amber SMPTE timecode.
- Motion is broadcast motion: hard cuts and instant state changes; easing exists only for meters and the ticker step.

## Colors

A graphite instrument palette: five near-black plate tones carrying one saturated
signal colour at a time, plus Claude Code's coral as the single product accent.

### Primary

- **Program Red** (`{colors.live}`): the program bus. It says "this source is working", never "this source has failed". Full strength plus an outer lamp glow means on air; a 72% mix into `ink-200` means the source is streaming output; a 40% mix means it is thinking. Also the record lamp in the rail, the top band of the PPM scale, and the default lit segment of every LED ladder.
- **Claude Coral** (`{colors.coral}`): the product accent, carried over from the real client. Tool-call bullets, the typing cursor, the model name in the PGM header, the permission-prompt frame and its selected option, the output-pressure histogram, and the solid `SWARM LOG` tag on the ticker.

### Secondary

- **Cue Green** (`{colors.cue}`): the preview bus, and by extension "nominal". As a tally it marks the source queued for the next cut during the 900ms cue lead — a solid border, a `PREVIEW` badge, a hard 300ms `steps(1)` blink, and a green `CUE SRC nn` plate that replaces the countdown in the PGM header. Outside the tally system it carries Git identity (branch name in the PGM strip, repo name in the ticker) and the in-range band of every meter: the bottom 62% of the PPM scale, the flat `sources live` channel, and the context-remaining bridge.
- **Readout Amber** (`{colors.amber}`): instrument amber for numbers and marks that are being read rather than states that are being watched — the SMPTE timecode, the three bus-channel readouts, the 62–84% caution band of the PPM scale, and every peak-hold cap.
- **Hold Amber** (`{colors.hold}`): the operator-blocked lamp. A source waiting on a permission prompt, a meter whose source is held, and a context bar that has fallen below 25%.

### Tertiary

- **Idle Blue** (`{colors.done}`): a finished session between tasks. The coldest and quietest lamp on the wall; it exists so "done" does not read as "broken".
- **Diff Green / Diff Red** (`{colors.add}` on `{colors.add-bg}` / `{colors.del}` on `{colors.del-bg}`): added and removed diff lines inside transcripts, plus the success line and the accept-edits mode line. These belong to the transcript's own grammar and never leak into chrome.

### Neutral

- **Plate Black** (`{colors.ink-000}`): the deck and the inside of every monitor.
- **Terminal Field** (`{colors.ink-050}`): the transcript background, the PPM track well and the histogram panel, one step up from the plate so a screen reads as lit glass inside a bezel.
- **Panel Graphite** (`{colors.ink-100}`): telemetry body, the ticker rail, and the printed segment rules inside a PPM track.
- **Label Graphite** (`{colors.ink-150}`): every UMD strip, header bar and the telemetry title bar; also the top stop of the rail's vertical gradient.
- **Chip Graphite** (`{colors.ink-200}`): the source-number chip, the resting `NEXT CUT` plate, and the mix partner for every dimmed tally colour.
- **Hairline** (`{colors.line}`) / **Bright Hairline** (`{colors.line-hi}`): internal dividers and structural edges respectively. `line-hi` is also the ink for the registration crosses, the title-safe brackets, and the graticule ticks and histogram rules.
- **Terminal Ink** (`{colors.txt}` / `{colors.txt-dim}` / `{colors.txt-fnt}`): the three-step transcript legibility ramp — said text, gutter results, context lines — measured at 12.4 / 10.4 / 7.5 against the panel well.
- **UMD Grey** (`{colors.umd}`): label-strip text, the user-turn line in transcripts, and the PPM reference mark. Measured at 5.3 against the panel well.
- **Emphasis White** (`{colors.txt-hi}`): the single brightening step. Wordmark, agent names, source-number chips, PGM key values, rail stat figures, transcript prose, the prompt question.

### Ink On A Lamp

- **`{colors.on-live}` / `{colors.on-cue}` / `{colors.on-coral}`**: the inks for text sitting *on* a saturated fill — the `PGM` tag and on-air badge, the `PREVIEW` badge and cue plate, the `SWARM LOG` tag. A saturated lamp is a background, and a background needs its own ink token rather than a guessed white.

### LED Ladder

- **`{colors.led-off}`**: an unlit meter segment. Deliberately visible — a ladder has to be readable as a ladder before a lit segment can mean anything.
- **`{colors.led-hot}`**: the top two segments of any ladder, burning hotter as a peak indicator.

### Named Rules

**The Program-Bus Rule.** Red is not an error colour on this wall. Red means the source is doing work, and its intensity encodes how much: full + glow = on air, 72% mix = streaming, 40% mix = thinking. Nothing on this surface may use red to mean failure except a diff deletion, which is transcript grammar rather than chrome.

**The Preview-Only Tally Rule.** Green is never a tally state a source can reach on its own — it appears on a source only when the mixer has queued it for the next cut. (Divergence from the stated world, which reserved green "exclusively" for the preview bus: the build gives cue green two further jobs outside the tally system — Git identity for branch and repo names, and the in-range band of every meter. That is the actual system; what holds without exception is the tally prohibition.)

**The Two-Ambers Rule.** Readout amber (`{colors.amber}`) is for numbers and marks you read; hold amber (`{colors.hold}`) is for a source that needs you. They are close enough to look like a mistake and are not — do not collapse them, and do not use readout amber as a lamp.

**The One-White Rule.** There is one emphasis white (`{colors.txt-hi}`) and one ink per lamp colour. Near-white variation reads as drift, never as hierarchy; if a value needs to be brighter than `{colors.txt}`, it goes to `{colors.txt-hi}`, not to a new hex.

**The One-Signal Rule.** A panel shows exactly one signal colour at a time. Tally state, badge, meter tone and UMD state word all resolve from the same status value, so a source can never be two things at once.

## Typography

**Display Font:** Martian Mono (with `ui-monospace`, `monospace`)
**Body Font:** Iosevka (with `ui-monospace`, `SF Mono`, `Menlo`, `monospace`)
**Glyph patch:** GutterMark — a `@font-face` bound to `U+23BF` only

**Character:** Two monospaces with no overlap in job. Martian Mono is wide, mechanical
and heavily tracked — it behaves like silkscreen printed onto a rack panel, and is the
only face allowed to be uppercase. Iosevka is narrow and quiet, chosen because a dense
terminal needs characters per line more than it needs personality. Ligatures are
disabled globally so the transcript renders the way a real terminal does.

GutterMark is not a third register. It is a `@font-face` whose `src` is a list of
`local()` system faces and whose `unicode-range` is the single codepoint `U+23BF` —
the `⎿` result gutter Claude Code actually prints, which no monospace on the target
machine carries, and which otherwise falls back to a double-width box that breaks
column alignment. It sits first in the body stack so that one character resolves
against a face that has it; every other codepoint falls straight through to Iosevka.

### Hierarchy

- **Display** (Martian Mono 700, `clamp(17px, 2.05vw, 38px)`, line-height 1, tabular): the SMPTE timecode in the rail, centred. The frame counter rides beside it at roughly half size in a dimmed amber mix.
- **Headline** (Martian Mono 700, `clamp(9.5px, 0.86vw, 15px)`, line-height 1, tabular, amber, right-aligned): the numeric readout at the end of each bus channel. Small, because on this panel the bar carries the magnitude and the numeral only confirms it.
- **Title** (Martian Mono 700, `clamp(11px, 1.02vw, 18px)`, `0.14em`, uppercase): the wordmark only.
- **Body** (Iosevka 400, `clamp(9px, 0.67vw, 13px)`, line-height 1.44): source-tile transcripts. The program monitor uses the larger `body-pgm` step (`clamp(10.5px, 0.84vw, 16px)`, line-height 1.5) — the only typographic difference between PGM and a tile, and the thing that makes the size hierarchy read.
- **Label** (Martian Mono 500, `clamp(6.5px, 0.46vw, 9.5px)`, `0.1em`, uppercase, line-height 1): every piece of chrome — UMD strips, count pills, graticule numerals, badges, plates, the ticker tag. Exposed as the `.umd-type` utility class; anything wearing chrome wears that class.

### Named Rules

**The Two-Register Rule.** Martian Mono is the chrome register and Iosevka is the body register, and no string crosses. If it is uppercase and tracked it is chrome; if it is a transcript it is Iosevka. There is no third face and no display serif.

**The Glyph-Patch Exception.** A `@font-face` scoped by `unicode-range` to a single codepoint is a character repair, not a type register, and is the only sanctioned way to add a family to the stack. It must borrow `local()` faces, cover exactly the codepoints the body face lacks, and add no weight, no download, and no styling of its own. Reading GutterMark as licence for a third family is the misreading this rule exists to prevent.

**The One-Weight Rule.** Iosevka ships at weight 400 only — roughly 1 MB per weight — so the transcript has no bold. Emphasis inside a panel is always a colour change. Martian Mono carries 400/500/700 because 7px chrome needs weight contrast to survive.

**The Hanging-Gutter Rule.** Every transcript line carries `padding-left: 3ch; text-indent: -3ch`, so a soft-wrapped line stays under its own gutter instead of resetting to column zero. This is what makes a clipped 9px terminal still parse as a terminal.

**The Tabular Rule.** Any number that changes on screen wears `.tnum`. Timecodes, cut countdowns, token counts, tool counts, source numbers, context percentages. A digit that shifts width on camera reads as a glitch.

## Layout

The deck is a fixed three-band column at `100dvh` with `overflow: hidden` on the body:
a rail across the top, the wall in the middle taking all remaining height, and the
ticker across the bottom. Every band is `flex: none` except the wall.

**The wall** is a two-column grid at `minmax(0, 41fr) minmax(0, 59fr)` with
`{spacing.gap}` both as gutter and as padding. The left column stacks the program
monitor (`flex: 1`) over the telemetry panel (`flex: none`); the right column is a
3x3 grid of source tiles with equal fractional rows and columns. The wall carries a
faint radial rack-panel wash from its top edge so the tiles read as mounted rather
than floating, and 11px cross-hair registration marks at the top-left and bottom-right
corners at 50% opacity.

**Rhythm.** One spacing token does nearly all the work: `{spacing.gap}` between and
around every panel. Inside panels the scale is `6px` (tight label rows), `10px` (strip
padding, header gaps, channel gutters), `12px` (panel padding). The telemetry panel
adds one structural measure: a `{spacing.scale-gutter}` left inset on the histogram
reserved for its scale numerals, so a printed number never sits on a bar. Panel heights
are viewport-scaled clamps rather than fixed pixels, so the whole rack breathes with
the window instead of reflowing.

**Instrument rows** share one internal grid: `clamp(64px, 7.5vw, 108px)` label,
flexible track, `clamp(44px, 5vw, 72px)` readout. The graticule is a fourth row on the
same grid, which is what lets three channels and one printed scale line up as a bridge
rather than as three separate widgets.

**Density is preserved by dropping labels, never by scrolling.** Responsive behaviour
is a fixed sequence of subtractions:

- **≤1080px** — the wall stacks to a single column at `52fr / 48fr` (program stack above, 3x3 grid below); the rail's entire stats cluster is dropped and the rail becomes two columns.
- **≤900px** — the PGM UMD strip drops everything past the branch pair (`t+`, tools, token counters) and the task line disappears from the PGM header.
- **≤860px** — the rail's channel subtitle and the `25 fps` tag are dropped.
- **≤720px** — the wall shifts to `46fr / 54fr` and the grid becomes 2 columns × 5 rows; source tiles drop their repo/branch label and their status bar; the telemetry context bridge is dropped and the histogram fixes at 30px.

### Named Rules

**The No-Scroll Rule.** Nothing on this surface scrolls, at any width. Panels clip; transcripts are bottom-anchored (`justify-content: flex-end`) so the newest line is always the last visible one. A scrollbar would break the object.

**The Subtraction Rule.** At a narrower viewport, remove labels — never shrink the wall, never reduce the source count, never let a panel collapse below readable transcript size. The source number, name, meter and tally state are the four labels that survive every breakpoint.

## Elevation & Depth

This system has almost no elevation model. Depth is tonal: a five-step graphite ramp
(`ink-000` plate → `ink-050` lit terminal field and meter well → `ink-100` panel body →
`ink-150` label strip → `ink-200` chip) separated by exactly 1px hairlines. Outward
shadows are not used for lift at all — every one of them is a **lamp**, a coloured
bleed announcing a state, drawn in the state's own colour with a 1px colour ring plus a
wide soft halo.

There is exactly one recess. The program monitor's screen sits below its rack plate
(`inset 0 0 0 1px rgb(0 0 0 / 100%), inset 0 3px 9px rgba(0, 0, 0, 0.75)`) — a hard
black seam plus a top-weighted inner shadow, the way a monitor sits in a cut-out. Two
lighter inset effects also exist and are wells rather than recesses: the PPM tracks and
context bridge tracks carry `inset 0 0 0 1px var(--line)` as a printed frame.

### Shadow Vocabulary

- **Program lamp** (`box-shadow: 0 0 0 1px color-mix(in oklab, var(--live) 30%, transparent), 0 0 40px color-mix(in oklab, var(--live) 16%, transparent)`): the program monitor, permanently.
- **Monitor recess** (`inset 0 0 0 1px rgb(0 0 0 / 100%), inset 0 3px 9px rgba(0, 0, 0, 0.75)`): the program monitor's screen. The single sanctioned depth event on the surface.
- **Tile on-air lamp** (`0 0 0 1px color-mix(in oklab, var(--live) 45%, transparent), 0 0 22px color-mix(in oklab, var(--live) 26%, transparent)`): the source tile mirroring PGM.
- **Working bloom** (`inset 0 0 22px color-mix(in oklab, var(--live) 8%, transparent)`): a streaming source; inset, so it reads as heat inside the panel rather than a lift.
- **Hold lamp** (`0 0 16px color-mix(in oklab, var(--hold) 20%, transparent)`): a source blocked on an operator.
- **Preview lamp** (`0 0 0 1px color-mix(in oklab, var(--cue) 55%, transparent), 0 0 20px color-mix(in oklab, var(--cue) 28%, transparent)`): the cued source.
- **Record lamp** (`0 0 10px var(--live)`): the 8px record dot, on its bright half-cycle only.
- **Instrument well** (`inset 0 0 0 1px var(--line)`): PPM tracks and context bridge tracks. A printed frame, not depth.
- **Timecode bloom** (`text-shadow: 0 0 18px color-mix(in oklab, var(--amber) 34%, transparent)`): the display timecode only. The single glowing piece of type on the surface.

### Named Rules

**The Lamp-Not-Lift Rule.** No outward shadow on this wall is a lift. Every one is tinted by the state it announces, and no neutral or black outward shadow exists anywhere in the build. Depth is spent once, inward, on the program monitor's recess — that is the single sanctioned exception, and it earns it by being the one object that is physically a screen in a plate. If any other surface needs to separate from its neighbour, change its ink step or draw a hairline.

**The Hairline Rule.** Structural edges are `{colors.line-hi}`, internal dividers are `{colors.line}`, and both are exactly 1px. No 2px dividers, no gradients-as-borders, no soft separators.

## Shapes

Hard rectangles. Corners round at `{rounded.panel}` (2px) on the program monitor,
source tiles and telemetry panel — enough to read as machined, not enough to read as a
card. Count pills round at 1px, which is effectively an optical correction rather than
a radius. The permission prompt is the single 4px corner on the surface, and it is
4px because that is what the real Claude Code client draws.

Border weights encode rank: 2px on the program monitor, 1.5px on source tiles, 1px on
telemetry and every internal rule. Two geometric devices punctuate the plate, both
built from 1px linear-gradient strokes rather than borders: 11px **registration
crosses** at opposite wall corners, and 12px-armed **title-safe brackets** inset
`clamp(6px, 0.8vw, 14px)` inside the program monitor's screen.

Meters are strictly rectangular. LED ladders are `repeat(n, 1fr)` segment grids with a
1px gap — no rounding, no gradient fill, no partial segment. PPM tracks carry their
segmentation as a printed `repeating-linear-gradient` every 5% of scale, a 1px
reference mark that overhangs the track by 2px top and bottom, and a 2px peak-hold cap.
The graticule prints 1px × 3px ticks with numerals centred beneath them.

### Named Rules

**The Two-Pixel Rule.** Corners are 2px or 0. The one exception is the permission prompt at 4px, which is fidelity to the real client, not a system radius. Nothing here is ever a rounded card.

**The Printed-Scale Rule.** An instrument shows its scale whether or not there is a signal: segment rules, ticks, numerals and the reference mark are drawn on the empty track. An unlabelled gridline and an unlit ladder that cannot be seen both measure nothing.

## Components

### Program Monitor (PGM)

The largest object on the wall and the only one that is permanently lit. A 2px program-red
border with a permanent program lamp, a `PGM` tag in solid red at the head of a
`{colors.ink-150}` header bar carrying source number, agent name, task (ellipsised,
flexing), and model in coral. Its screen is recessed into the plate and holds a larger
transcript step plus title-safe brackets. A UMD strip beneath runs key/value pairs —
repo, branch (in cue green), elapsed `t+`, tool count, `↑`/`↓` token totals — with a
16-segment peak-holding level meter pushed right.

**The cut clock** closes the header. At rest it is a `{colors.ink-200}` plate reading
`NEXT CUT 10.5`, counting down in tenths; during the 900ms preview lead it is replaced
in place by a solid cue-green plate reading `CUE SRC 04`. The signature interaction is
900ms long, and without a number beside it the viewer reads it once and thereafter
reads it as decoration.

**The cut** itself is a hard vision-mixer flash: a white/coral horizontal-band overlay
in `mix-blend-mode: screen`, opacity driven directly by a 190ms decay counter, with no
transition and no fade curve.

### Source Tile

Nine identical tiles carrying a clipped transcript over a UMD strip. The tally is the
tile's own border, resolved by a single `data-tally` attribute:

- **`air`** — solid `{colors.live}` + on-air lamp, plus a solid red `PGM` badge in the feed corner.
- **`run`** — 72% red mix border + inset working bloom.
- **`cue`** — 40% red mix border, no glow (thinking is quieter than streaming, not a different colour).
- **`hold`** — solid `{colors.hold}` + hold lamp.
- **`done`** — 40% `{colors.done}` mix, no glow.
- **`cued`** (preview, overrides all) — solid `{colors.cue}` + preview lamp + a 300ms `steps(1)` blink and a green `PREVIEW` badge.

The UMD strip is a 5-column grid: source-number chip (inverted, stretched full height),
agent name, `repo ▸ branch`, a 9-segment peak-holding meter that switches to amber tone
when the source is held, and the tally state word (`on air` / `live` / `think` / `hold`
/ `idle`) tinted to match the lamp.

### Terminal

The transcript field. Bottom-anchored, clipped, on `{colors.ink-050}`. Line kinds are
styled globally in `app.css` rather than scoped in the component, because the kind
arrives as a runtime value that Svelte's scoped-CSS pruning cannot see statically —
scoping them would silently delete the rules. Fourteen kinds map to the real client's
roles: `tool` (brightened, coral `⏺` bullet), `gut`/`cont` (dim result gutters), `ctx`
(faint diff context), `add`/`del` (tinted text on a translucent tinted band),
`todo-done`/`todo-open`, `text`, `user`, `err`, `ok`, `dim`, `spin`, and `rule` (a
dashed 1px separator with 0.6em breathing room, used to mark a session turnover).

A block cursor (0.62em × 1em, coral) blinks on the streaming line at a 530ms half-cycle,
and the spinner cycles the real client's `· ✢ ✳ ∗ ✻ ✽` glyph set at 110ms alongside a
faint `(Ns · ↑ Nk tokens · esc to interrupt)` meta. The status bar pins the accept-edits
mode line (in a green/faint mix) against `model · N% context left`.

The **permission prompt** is the one framed object inside a transcript: a 4px coral
border on an 8% coral wash, with title, indented body, question and numbered options
where the selected option is coral and prefixed `❯`.

### LED Meter

A segmented ladder, `repeat(n, 1fr)` at 1px gaps, unlit segments at `{colors.led-off}`.
Lit segments take the tone prop (`live` default, `amber` for held sources, `cue`,
`coral`), and the top two segments burn at `{colors.led-hot}` as a peak indicator. An
optional `peak` prop lights a single amber cap segment at the held peak whenever that
segment sits above the current reading — catch instantly, decay over roughly 2.6
seconds. Segments cross-fade at 90ms linear: fast enough to look electrical, slow
enough not to strobe. Used at 16 segments under PGM and 9 segments in each tile UMD
strip.

### Telemetry — Swarm Bus

A meter bridge, not a stat row. Under a `SWARM BUS · PPM · % OF SCALE` title bar, three
channels share one printed scale: tokens/min against a 60,000 full-scale reference,
tool calls/min against 300, and sources live as a fraction of the source count. Each row
is label, PPM track, amber readout. Below them a graticule prints ticks and numerals at
0/20/40/60/80/100 on the same grid, and every track carries a reference mark at 70%.

The scale colours belong to the **track**, not the fill: the fill spans the whole track
with the full green/amber/red gradient and is clipped back to the reading with
`clip-path`. Peak-hold caps are 2px amber bars. The `sources live` channel is flagged
flat and drawn in plain green, because every source working is the nominal state there,
not an overload.

Beneath it, an **output pressure** histogram of 90 coral bars — newest three at full
coral, the rest at a 58% mix — with numbered 25/50/75 rules across it and a reserved
left gutter for their numerals. Then the **context remaining** bridge: nine vertical
tracks scaling on `transform: scaleY()` at 300ms linear, scaled rather than resized
because nine of them move at once and only transform stays off the layout path. A track
below 25% switches to hold amber.

### Rail

The top band: brand cluster left, timecode centre, stats cluster right, on a vertical
`ink-150 → ink-100` gradient with a bright hairline underneath. The stats cluster is a
record lamp (620ms hard toggle, no fade; held lit in calm mode) followed by four count
pills — live / think / hold / idle — each bordered and tinted by its own tally colour,
then plain token and tool-call totals in faint grey.

### Ticker

The bottom band. A solid coral `SWARM LOG` tag, then a crawl of ten fixed-width event
cells (`--cw: clamp(230px, 24vw, 400px)`) divided by 1px verticals, masked to dissolve
into the right edge on an alpha stop. Each cell reads an inverted source-number chip, a
two-digit seconds clock, repo in cue green, and event text. On every arrival the row
steps exactly one cell width (`translateX(-1 cell) → 0`, 260ms
`cubic-bezier(0.22, 0.7, 0.3, 1)`) instead of reflowing — variable-width reflow is what
makes nine simultaneous reporters look like noise. Fewer, wider cells so each event
survives being read at a glance rather than truncating to a verb.

### Named Rules

**The Hard-Cut Rule.** State changes are cuts, not transitions. Tally borders move at 120ms linear, the preview blink uses `steps(1)`, the cut flash has no curve at all, and the record lamp, cursor and spinner are modulo toggles off the frame clock. Easing exists in exactly two places: the meter transitions and the ticker's one-cell step.

**The Calm-Variant Rule.** Under `prefers-reduced-motion`, the surface does not stop being a multiviewer; it stops fidgeting. Transcript lines land whole instead of typing, held to a 520ms floor so fewer whole lines do not become more motion than typing was; the cursor holds solid; the spinner freezes at `✻`; the record lamp holds lit; the ticker stops stepping; and cutting is disabled, which retires the countdown. Every layout, colour and lamp is unchanged.

**The Scale-On-Track Rule.** A meter's scale colours belong to its track, and the fill is clipped back to the reading. A bar that carries its own gradient shows "into the red" at 10% of scale, which is a lie about the measurement. Full-scale references are constants, printed, and never auto-fitted to the data.

**The Runtime-Kind Rule.** Any class whose value is computed at runtime — transcript line kinds, tally states — is styled globally or via a `data-` attribute, never in a scoped block. Scoped CSS prunes what it cannot see statically.

**The Never-Empty Rule.** Every panel opens mid-flight with 7–16 pre-filled blocks of scrollback, and scrollback survives a task turnover (a dashed rule is inserted instead of clearing). An empty panel on this wall reads as a dead feed.

## Do's and Don'ts

### Do:

- **Do** resolve every status from one value. Border, badge, meter tone and UMD word all derive from the same `run | cue | hold | done` status, so a source can never display two states.
- **Do** use `{spacing.gap}` as the only gutter between panels, and clamp panel heights to the viewport rather than fixing pixels.
- **Do** put every piece of chrome in the `.umd-type` label register (Martian Mono 500, uppercase, `0.1em`) and every transcript in Iosevka 400.
- **Do** put `.tnum` on any number that changes on screen.
- **Do** reach for `{colors.txt-hi}` when something needs to be brighter than `{colors.txt}`, and for the matching `on-*` token when text sits on a saturated lamp.
- **Do** express emphasis inside a transcript with colour. There is no bold Iosevka on this surface and adding one costs about 1 MB.
- **Do** style runtime-valued classes globally in `app.css`, alongside the existing `.ln` rules.
- **Do** draw new signal states as coloured 1px hairlines and coloured lamps, and derive dimmed variants with `color-mix(in oklab, <signal> N%, var(--ink-200))` the way the tally system already does.
- **Do** print an instrument's scale — ticks, numerals, segment rules, reference mark — on the empty track, and put the scale colours on the track with the fill clipped back to the reading.
- **Do** give a timed state a number beside it. A 900ms event that shows no countdown is read once and then read as decoration.
- **Do** keep the transcript bottom-anchored and clipped; add density, never a scrollbar.

### Don't:

- **Don't** use red to mean failure in chrome. On this wall red is the program bus, and it means the source is working.
- **Don't** give a source green as a tally state. Cue green reaches a source only through the preview bus; its other jobs are Git identity and the in-range band of a meter.
- **Don't** interchange the two ambers: `{colors.amber}` is instrument readout and peak-hold, `{colors.hold}` is the operator-blocked lamp.
- **Don't** add a neutral or black outward shadow, and don't add a second recess. The program monitor's screen is the whole depth budget; use an ink step or a hairline instead.
- **Don't** introduce another near-white literal. One survives in the build (`.ln.tool` at `#e6edf3`) and it is drift, not a second emphasis step; use `{colors.txt-hi}`.
- **Don't** exceed a 2px corner radius. The 4px permission prompt is client fidelity, not a licence for rounded cards.
- **Don't** add a third font family. A `unicode-range`-scoped `@font-face` repairing a missing glyph is not one; anything that renders more than the codepoints the body face lacks is.
- **Don't** let a meter auto-fit its scale to the data, and don't paint the gradient onto the fill.
- **Don't** animate a state change with a fade. Broadcast switches; it does not dissolve.
- **Don't** answer `prefers-reduced-motion` by freezing the surface or dropping panels. Slow the content, hold the indicators, keep the wall.
- **Don't** let a panel render empty or ship a scrollbar. Both break the object the surface is imitating.
