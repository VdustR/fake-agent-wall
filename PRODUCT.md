# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Svelte 5 + Vite 8 + oxlint (oxc) + pnpm. Chosen by the user in the brief.

## Users

V (VdustR), operating a laptop. The page is a **video prop**: it runs on screen while
something else is being filmed, recorded, or shown to an audience, so the primary
"user" is really the camera and the people watching it, not someone operating a tool.

## Product Purpose

Show a wall of Claude Code agent sessions all working at once, convincingly enough
that a viewer believes a real swarm is running. Everything on screen is fabricated.
Success = a viewer glances at it and reads "a lot of serious machine work is happening
right now", and a developer who knows Claude Code does not spot the format as fake.

## Positioning

Not a generic "hacker terminal" screensaver. It reproduces Claude Code's actual
transcript grammar — tool-call bullets, result gutters, diff hunks, todo checklists,
permission prompts, the real spinner verb list, token/context accounting — so it
survives being looked at closely.

## Operating Context

Runs full-screen in a browser on a laptop, unattended, for minutes at a time.
No keyboard or mouse interaction during use. Must not drift, stall, crash, or
visibly loop within a recording-length window.

## Capabilities and Constraints

- Autoplay only. The user confirmed no interactive controls are needed.
- Many concurrent agents on screen at once ("多 agents").
- Desktop-first laptop viewport is the shipping target.
- Purely client-side. No backend, no network calls at runtime.
- Must hold a steady frame rate with every panel animating simultaneously.
- All content is synthetic. Repo names, file paths, diffs, and metrics are props.

## Brand Commitments

- The in-panel transcripts must read as Claude Code, including its glyph set
  (`⏺`, `⎿`, `✻`), its coral accent, and its status-line conventions.
- The user's direction for the surrounding surface: "越花俏越好" — maximal showpiece.

## Evidence on Hand

- Claude Code binary at `/Users/v/.local/share/claude/versions/2.1.212`.
  243 spinner verbs extracted from it verbatim (`.verbs.txt`), plus real UI
  strings (`ctrl+o to expand`, `esc to interrupt`, accept-edits mode line).
- No real agent telemetry exists and none will. Nothing on this surface may be
  presented as a measurement of anything real.

## Product Principles

1. Fabricated content, real format. The lie is the data, never the grammar.
2. It has to survive a pause button — a still frame must hold up.
3. Density is the message: emptiness reads as "nothing is happening".
4. Unattended means self-sustaining; no state may run out or repeat visibly.
5. Never imply a real capability, benchmark, customer, or price.

## Accessibility & Inclusion

Honor `prefers-reduced-motion` by holding panels static with a slow content
swap instead of continuous typing.
