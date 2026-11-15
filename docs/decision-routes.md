# Bounded decision routes

Researched November 15, 2026. The wall displays synthetic judgments and does
not call providers, require keys or implement their request schemas.

| Route | Current official evidence | Display |
| --- | --- | --- |
| TypeSafe / `jev` | [Current model reference](https://docs.typesafe.ai/models): Jev 1.14, alias `jev-latest` now points to `jev-1.14.0`; Choice, Score, Noul and Box. | Keep short label, choice probabilities, Noul binary probability and a rubric score. |
| OpenAI / `luna` | [Decisions API](https://developers.openai.com/api/docs/guides/decisions) is GA, native model `gpt-6-luna`, endpoint `/v1/decisions`; predicates, choices and scores over text, images and JSON. | `Decisions API / luna`, probabilities, generic yes/no and score. Remove the obsolete preview label. |
| Google / `gemini-decision-1` | [November 11 announcement](https://blog.google/innovation-and-ai/technology/developers-tools/gemini-decisions-api/) and [model reference](https://aistudio.google.com/docs/models/gemini-decision-1): multimodal input, binary/choice/score judgments, up to 1,000 independent questions. | `Gemini Decisions API / gemini-decision-1`, probabilities, generic yes/no and score. |
| Microsoft / `microsoft-decision-1` | [October 9 announcement](https://commandline.microsoft.com/microsoft-decision-1-model-foundry/) and [Foundry reference](https://learn.microsoft.com/en-us/azure/foundry/foundry-models/how-to/use-foundry-models-microsoft-decision): text/JSON state and bounded typed numeric judgments. | `Microsoft Foundry / microsoft-decision-1`; lowercase label is display-only, native model is `Microsoft-Decision-1`. |

## Presentation ownership

Route capabilities describe choice distributions, binary labels and rubric
scores independently of vendor-specific schemas. Jev retains its familiar
`noul` line; other routes use generic `yes/no` language. No route is assigned
another provider's endpoint, SDK syntax, audio support or Box capability.
OpenRouter/OpenCode aliases are not asserted to be native provider IDs.

Each synthetic scene owns structured labels and probabilities. The selected
result is the highest-probability choice, rather than a duplicated result string.
Choice/rubric distributions sum to one. Binary `p(yes)` is distinct from
confidence in the answer: a 0.06 yes probability has 0.94 confidence in no.
Rubric scores are expected zero-based positions, so a fractional score is valid;
the visible endpoints define the scale. Rubric confidence is the most likely
level's probability. These are fictional values, not provider measurements.

Shared state, task-specific scenes, fast delivery, execution boundaries and the
eight-second recent-result strip remain unchanged. Extra lines use the same
fast playback path. Unrelated tasks never receive a decision scene.

## API and workflow boundaries

Google's [guide](https://aistudio.google.com/docs/decisions-api) documents
`/v1beta/decisions` and `client.decisions.create`. Questions share input but do
not see one another's answers. Downstream code combines judgments and handles
confidence thresholds or an out-of-scope option. A decision model does not
generate a chat response, execute a tool or replace workflow authorization.
Google's advertised latency describes benchmark conditions, not every maximum
context or question count; the wall's timing remains an explicitly synthetic
scene duration. No vendor latency guarantee is introduced.

[Antigravity Orchestrator](https://antigravity.google/docs/models) is a separate
product mode that hands work between a planner and Hydrogen execution; `/swarm`
is parallel teamwork. Neither is a new model nor implemented by this refresh.

## Acceptance

Seeded playback covers all four routes, normalized distributions, distinct
negative binary probability/confidence, derived rubric scores and selected
results. The agent completes promptly with reduced motion and preserves the
recent-result lifetime. Provider labels remain readable at normal and narrow
sizes. Run lint, Svelte check, tests and build. SDK compatibility, real API
responses and account availability are not established by these checks.
