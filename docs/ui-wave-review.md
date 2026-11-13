# UI wave inventory and audit

Reviewed November 13, 2026.

## Delivery scope

This report covers the November 13 UI wave beginning with terminal palette fidelity,
including the approved host/system/process/clock work. Existing desktop packaging,
fullscreen lifecycle, model catalog and dependency maintenance are outside the wave.
The product remains a synthetic ambient coding wall; local civil time is real.

## Shipped decisions

| Area | Final behavior | Delivery |
| --- | --- | --- |
| Terminal palette | Transcript, status, prompts and decisions use preset terminal colors; equipment surfaces retain derived colors. | [Palette fidelity](https://github.com/VdustR/fake-agent-wall/pull/93) |
| Bundled typography | Monaspace Xenon for terminal/code, Barlow Condensed for chrome, Cormorant Garamond for editorial/settings hierarchy. | [Typography](https://github.com/VdustR/fake-agent-wall/pull/95) |
| Default palette | Gruvbox Dark is the default; saved user preferences still win. | [Default theme](https://github.com/VdustR/fake-agent-wall/pull/96) |
| Font input | Preserve the original CSS-stack fields and native caret editing; fuzzy, virtualized suggestions include generic keywords, bundled faces and opt-in system fonts. Existing stack entries are excluded. | [Autocomplete](https://github.com/VdustR/fake-agent-wall/pull/97) |
| Interface copy | Remove redundant helper prose, repeated labels and always-on shortcut hints; retain meaningful status/recovery. | [Copy reduction](https://github.com/VdustR/fake-agent-wall/pull/98) |
| Density | Viewport-scaled wall type/strips are deliberate. Settings retain an independent readable scale. The fixed wall reading scale was evaluated then reversed. | [Reading-scale experiment](https://github.com/VdustR/fake-agent-wall/pull/99), [density restoration](https://github.com/VdustR/fake-agent-wall/pull/102) |
| Motion | Running-name light sweep, breathing activity signals, place-keyed rolling readouts, quick meter attack and slow release. Preserve reduced-motion and visual-pause behavior. | [Component motion](https://github.com/VdustR/fake-agent-wall/pull/100) |
| Baselines and units | Hidden in-flow name anchors preserve baseline; compact token values explicitly say k tokens. | [Alignment and units](https://github.com/VdustR/fake-agent-wall/pull/101) |
| Swarm Bus | A shallow strip replaces the full mosaic panel; short throughput meters, pressure trace and compact context cells return area to terminals. | [Compact bus](https://github.com/VdustR/fake-agent-wall/pull/103) |
| System and Processes | Independent System tile with 16 simulated logical CPUs, allocation/release and I/O histories; PID-keyed process table uses one-core CPU units and stable sorting. | [Host telemetry](https://github.com/VdustR/fake-agent-wall/pull/104) |
| CPU continuity | Continuous seeded demand, task-phase ramps, stable lane affinity and slow drift; full-interval meter transitions and scrolling observed histories. | [Host telemetry](https://github.com/VdustR/fake-agent-wall/pull/104) |
| Real time | Local system time to milliseconds on paint, no clock roll; direct resync after visibility/pageshow, real event timestamps. OS accuracy and display refresh still bound the result. | [Host telemetry](https://github.com/VdustR/fake-agent-wall/pull/104) |

## Audit criteria

Preserve the approved visual world, typography/density and simulation boundary.
Check cross-surface identity, units and time meaning; resource conservation and
causal workload behavior; layout resilience; editing/lifecycle/reduced motion;
and consistency between final code, earlier conventions and this design record.
Only confirmed findings become correction units. Passing tests are evidence of
the exercised contracts, not proof of physical-device or extreme-wall acceptance.

## Findings

| ID | Disposition and evidence | Correction unit |
| --- | --- | --- |
| A01 | Corrected, pre-existing. Tile tally compares one-based slots with zero-based routing indexes. Fresh page shows source01 in PGM and source tile01 without an air tally. | [Source identity](https://github.com/VdustR/fake-agent-wall/pull/105): object-based selectors align PGM/preview/tile. |
| A02 | Corrected, pre-existing. Retiring agents removes their lifetime counters; a 60→26 resize regresses totals and can show negative throughput. | [Fleet continuity](https://github.com/VdustR/fake-agent-wall/pull/106): wall-owned ledger, per-producer reset handling and retirement cleanup. |
| A03 | Corrected. At 372250ms the seeded download workload caps receive at 1000Mb/s but still writes 159.402MiB/s, above the corresponding 119.209MiB/s payload. | [Traffic budgets](https://github.com/VdustR/fake-agent-wall/pull/107): link saturation reduces dependent payload I/O before aggregate disk limiting. |
| A04 | Corrected. At 640×700 with a supported long model and a valid monospace UI stack, header glyphs escape shrinking fields into neighbors. The 390px case alone did not reproduce it. | [Program header](https://github.com/VdustR/fake-agent-wall/pull/108): container-aware priority and clipping protect source/cut plates. |
| A05 | Corrected design conflict. Civil event time 21:26:13.437 is displayed as 13.437s, which reads as a duration. Capture is accurate; presentation loses the clock context. | [Event clock](https://github.com/VdustR/fake-agent-wall/pull/109): full local clock without a duration suffix; README distinguishes real clocks from simulated durations. |
| A06 | Corrected in this change. Numeric highlight text has only 1.72:1 contrast in Adwaita and 1.44:1 in Alabaster. Raw terminal ANSI fidelity is correct, but direct ANSI-to-UI readout mapping is not universally readable. | Separate per-surface readout ink and plot strokes from unchanged ANSI/lamp colors. |

The design record also reconciles the three editable font roles and the accepted
routing/activity illumination with earlier wording that described two roles and
no glow. These documentation corrections preserve the implemented design.

## Verification and design rationale

- Model regressions cover program/preview identity, retirement and replacement,
  monotonic counters, seeded joins without artificial rate spikes, full-duplex
  network limits and proportional disk saturation. Before the fixes, the targeted
  regressions failed; the final suite has 128 passing tests.
- The original saturated download witness now reports 1000Mb/s and
  119.209MiB/s writes. Read and write disk demand share the 800MiB/s budget;
  receive and transmit retain independent 1Gb/s budgets.
- Browser geometry checks cover 390×844, 640×700 and 1440×900 with bundled Barlow
  Condensed and a valid monospace stack, using long catalog model/session values.
  The old header paints outside fields; the corrected header keeps field boxes
  and unclipped glyphs within bounds. Full event clocks match captured values
  across all ten ticker cells at those widths.
- All 533 bundled presets pass an independent browser canvas/computed-style
  check: highlighted readouts on the 050/100/150 plates and actual CPU/clock text
  reach at least 4.52:1; both history strokes reach at least 3.03:1. Unit checks
  also cover custom mid-gray surfaces, unchanged terminal/ANSI exports, unchanged
  saved settings and original Gruvbox highlight hues.
- A single fixed foreground fallback loses signal identity and can fail across
  different lifted plates near mid-gray. Per-surface derivation retains readable
  original colors and adjusts insufficient ones toward black or white. Culori
  supplies the established color-space conversion/interpolation implementation;
  only RGB, linear RGB, OKLab and OKLCH modes enter the production bundle.
- `pnpm check`, `pnpm test`, `pnpm lint` and `pnpm build` pass. Existing lint and
  bundle-size warnings remain. Each correction ships independently with the
  repository's `verify` and `native-macos` CI gates, followed by a current-head
  feedback snapshot and explicit merge. Screenshots are attached to the relevant
  visual correction PRs.

Primary references: [counter and gauge semantics](https://prometheus.io/docs/tutorials/understanding_metric_types/),
[WCAG text contrast](https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum),
[WCAG non-text contrast](https://www.w3.org/WAI/WCAG21/Understanding/non-text-contrast.html),
[Culori color/contrast API](https://culorijs.org/api/) and
[Culori tree-shaking](https://culorijs.org/guides/tree-shaking/).
These are technical documentation references, without attached discussion threads.

## Preserved decisions and evidence limits

- Keep viewport-scaled ambient type and independent readable settings controls.
- Preserve exact terminal backgrounds/ANSI values; improve derived UI roles only.
- Keep synthetic workload data clearly separated from the real local wall clock.
- Native or physical-device acceptance and extreme 8K frame-rate guarantees remain unverified. A constrained headless stress run does not establish a native renderer defect.
- Existing font editing, generic/family deduplication, shared system-font permission, fuzzy search and virtualization checks passed; this audit found no new defect in those contracts.
- Reduced-motion, shared pause state, model CPU conservation and allocation/release checks remain valid. Do not replace accepted continuous CPU behavior with unrelated smoothing experiments.

