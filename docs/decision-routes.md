# Bounded decision routes

Researched October 1, 2026. [OpenAI's September 29 announcement](https://openai.com/index/devday-2026-recap/)
describes Decisions API as Luna-powered finite-answer decisions using text or
image context, in limited preview. It does not publish an endpoint, exact model
identifier, latency guarantee, probability distribution, or Jev-compatible
schema. `luna` is a display label, not an asserted API model identifier.

The wall is a client-side simulation. Adding real API credentials, requests,
or a backend would change the product scope. This change adds a simulated route.

## Structure

The existing state, choices, task-specific result, fast transcript delivery, and
eight-second recent-decision strip work for both routes. A route-level format
discriminator separates the displayed capabilities:

- Jev retains its existing choice probabilities and Noul yes probability.
- OpenAI shows `Decisions API (preview) / luna`, finite choices, and the selected
  result. It omits probabilities and Noul. The latency is a synthetic scene
  value, consistent with all other metrics in the wall.

The format is a presentation discriminator, not an SDK adapter or wire schema.
No component, agent lifecycle, or recent-decision structure needs to change.
Only adding a model name would incorrectly attribute Jev-specific output to
OpenAI. Endpoint and schema work remains unverified until official API reference
material is available; the simulation does not depend on it.

## Acceptance

Seeded transcript playback must exercise both routes. Jev must retain its
probability/Noul lines. Luna must show finite choices without those lines.
Both routes must select the scene's existing result, complete promptly in
reduced motion, and preserve the recent-decision lifetime. Unrelated tasks must
continue to exclude decision scenes. Run lint, Svelte checks, tests, and build.

## Jev release follow-up

Checked October 18, 2026. TypeSafe released
[Jev 1.14 on October 14](https://typesafe.ai/blog/jev-1-14), with general
improvements and a focus on multilingual support. The
[current model reference](https://docs.typesafe.ai/models) lists `jev-preview`
as `jev-1.14.0` and `jev-latest` as `jev-1.13.0`. The announcement plans to move
`jev-latest` a week after release; that future alias change is not treated as
already complete.

Keep the wall's short `jev` label and choice/Noul simulation. Experimental image
input and long context also support 1.13, while the new `box` question type is
limited to 1.14. Those capabilities do not add image or bounding-box scenes to
this refresh, and no real API integration is introduced.
