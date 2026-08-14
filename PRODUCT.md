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

Show a heterogeneous wall of coding-agent sessions all working at once, convincingly
enough that a viewer believes a real swarm is running. Everything on screen is
fabricated. Success = a viewer glances at it and reads "a lot of serious machine work
is happening right now", then finds internally consistent engineering detail up close.

## Positioning

Not a generic "hacker terminal" screensaver and not an imitation of one agent client.
It combines recognizable shell, diff, task-list, permission, token and context
conventions into a neutral orchestration surface that survives being looked at closely.

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

- In-panel transcripts use a consistent vendor-neutral grammar across providers.
- Provider and model labels may identify the simulated route, but no provider owns the
  visual system or interaction language.
- The user's direction for the surrounding surface: "越花俏越好" — maximal showpiece.

## Evidence on Hand

- The historical spinner corpus originated from a client binary. It is synthetic
  texture only; the displayed chrome and transcript grammar are product-owned.
- No real agent telemetry exists and none will. Nothing on this surface may be
  presented as a measurement of anything real.

## Product Principles

1. Fabricated content, coherent format. The data is invented; the grammar stays
   internally consistent without copying a vendor client.
2. It has to survive a pause button — a still frame must hold up.
3. Density is the message: emptiness reads as "nothing is happening".
4. Unattended means self-sustaining; no state may run out or repeat visibly.
5. Never imply a real capability, benchmark, customer, or price.

## Accessibility & Inclusion

Honor `prefers-reduced-motion` by holding panels static with a slow content
swap instead of continuous typing.
