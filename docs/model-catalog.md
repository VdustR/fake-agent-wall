# Model catalog

Researched October 18, 2026. These are curated display labels for synthetic
sessions, not an API inventory or claims of account access. Metrics remain
invented. The catalog preserves frontier, balanced, efficient, local, open-weight,
and specialized coding roles across providers. Access restrictions belong in
this research record; the wall does not call providers or require subscriptions.

## Add

| Provider | Display label | Role and official evidence |
| --- | --- | --- |
| Anthropic | `haiku-5.5` | Efficient coding subagents. [October 7 announcement](https://www.anthropic.com/claude-haiku-5-5) and [current lineup](https://platform.claude.com/docs/en/models/overview). API ID: `claude-haiku-5-5`. |
| Meta | `muse-wonder`, `muse-wonder-full` | Frontier coding and long-running agents. [October 12 announcement](https://about.fb.com/news/2026/10/introducing-muse-wonder-models/) and [model page](https://dev.meta.ai/models/muse-wonder). IDs: `muse-wonder-1.0` and `muse-wonder-full-1.0`. Wonder is available through Meta Model API and Muse Code; Full is limited to Muse Code Power Usage and Maximum Usage subscriptions. |
| Meta | `muse-spark-1.3` | Lower-cost coding and agent work. [September 2 announcement](https://research.meta.ai/blog/introducing-muse-spark-1-3) and [model page](https://dev.meta.ai/models/muse-spark). |
| Meta | `muse-spark-open` | Open-weight coding and agent workflows. [Model page](https://dev.meta.ai/models/muse-spark-open) and [research releases](https://research.meta.ai/), which date the release to October 15. |
| Meta | `muse-glimmer` | A distinct local, open-weight agent model. [Official model catalog](https://dev.meta.ai/docs/models) describes self-hosted deployment rather than Meta Model API access. |
| Mistral | `mistral-large-4-preview` | Frontier agentic coding, alongside Medium. [October 6 announcement](https://mistral.ai/news/mistral-large-4/) and [changelog](https://docs.mistral.ai/resources/changelogs). Public-preview API ID: `mistral-large-4`; the display label makes preview status explicit. Weights were announced for later in October and are not treated as released here. |
| MiniMax | `minimax-m3.1-flash-preview` | Multimodal coding with tunable thinking depth, alongside M3. [Official model catalog](https://platform.minimax.io/docs/guides/models-intro) limits this preview to M Plan and MiniMax Code. Model name: `MiniMax-M3.1-Flash-Preview`. |

## Update

| Provider | Previous label | Display label | Basis |
| --- | --- | --- | --- |
| Google | `gemini-3.1-pro` | `gemini-4-argon` | Replace the flagship reasoning/coding role. [September 30 announcement](https://blog.google/innovation-and-ai/models-and-research/gemini-models/gemini-4-argon/) preceded [October 13 general availability](https://ai.google.dev/gemini-api/docs/changelog); [model reference](https://ai.google.dev/gemini-api/docs/models/gemini-4-argon) confirms the stable ID. Keep Flash as a separate role. |

The provider usage display now uses Argon for Google and Large 4 preview for
Mistral, and adds a Meta row represented by Muse Wonder. All three labels occur
in the session catalog. Existing usage, reset, token, and cost behavior remains
synthetic; the Meta row adds illustrative values in the existing shape.

## Keep

| Provider | Labels | Official evidence |
| --- | --- | --- |
| OpenAI | `gpt-6-astra`, `gpt-6.1-sol`, `gpt-6-luna` | [Current model catalog](https://developers.openai.com/api/docs/models): frontier, balanced, and efficient roles. [Release notes](https://help.openai.com/en/articles/9624314-model-release-notes) do not require replacing these labels. |
| Anthropic | `opus-5.5`, `sonnet-5.5`, `fable-5.1` | [Current lineup](https://platform.claude.com/docs/en/models/overview) and [newsroom](https://www.anthropic.com/news). Haiku adds a distinct efficient role. |
| Google | `gemini-3.8-flash` | [Model catalog](https://ai.google.dev/gemini-api/docs/models) and [October 8 changelog](https://ai.google.dev/gemini-api/docs/changelog) retain 3.8 as the current Flash model. |
| xAI | `grok-4.7` | [Model catalog](https://docs.x.ai/developers/models) and [release announcement](https://x.ai/news/grok-4-7). |
| Mistral | `mistral-medium-3-5` | [Model catalog](https://docs.mistral.ai/models): agentic/coding model retained alongside the newer flagship. |
| DeepSeek | `deepseek-v4-pro`, `deepseek-v4.1-flash` | [Official changelog](https://api-docs.deepseek.com/updates/) confirms continued Pro service and the October 17 Flash refresh. Keep the short Flash family label rather than appending its `1017` snapshot; the API alias is `deepseek-flash`. |
| Alibaba | `qwen3.8-max`, `qwen3.8-flash` | [Current catalog](https://www.alibabacloud.com/help/en/model-studio/models) and [coding recommendations updated October 15](https://www.alibabacloud.com/help/en/model-studio/text-generation-model/). |
| Moonshot | `kimi-k3`, `kimi-k2.7-code` | [Current model reference](https://platform.kimi.ai/docs/api/models-overview), [quickstart](https://platform.kimi.ai/docs/overview), and [K3 release](https://www.kimi.com/news/kimi-k3-open-source). The coding label is a family display label; high-speed access uses `kimi-k2.7-code-highspeed`. |
| Z.ai | `glm-5.3` | [Provider model reference](https://docs.z.ai/guides/llm/glm-5.3); [Mistral's September 29 changelog](https://docs.mistral.ai/resources/changelogs) also lists 5.3 as the replacement for its hosted 5.2. |
| MiniMax | `minimax-m3` | [Model catalog](https://platform.minimax.io/docs/guides/models-intro) and [M3 announcement](https://www.minimax.io/blog/minimax-m3). |
| Baidu | `ernie-5.1` | [Official 5.1 announcement](https://ernie.baidu.com/blog/posts/ernie-5.1-0508-release/). |
| TypeSafe | `jev` (decision route only) | [October 14 Jev 1.14 announcement](https://typesafe.ai/blog/jev-1-14) and [model reference](https://docs.typesafe.ai/models). Keep the unversioned display label and existing choice/Noul presentation; see [decision routes](decision-routes.md). |

## Remove and exclusions

No standalone removals. Gemini 3.1 Pro is replaced in the flagship role, not
asserted to be retired. Older Spark versions and high-speed variants are omitted
in favor of the current family representative. Qwen Plus, Gemini Flash-Lite,
GLM Flash, and Mistral Small remain valid alternatives, but overlap the balanced
and efficient roles already represented. Codestral focuses on code completion;
Kimi Code already represents specialized coding sessions in this curated mix.

Image, audio, translation, embedding, and moderation models are outside the
coding-session mix. Speed tiers and reasoning efforts are settings rather than
distinct model families. Decisions API remains in the separate bounded-decision
display. Jev's experimental image, Box, and long-context capabilities do not
require new simulated scenes for this model-label refresh.

## Acceptance

The session catalog contains 27 unique labels across 12 providers. Provider usage
rows must refer to session labels, including Meta/Wonder, Google/Argon, and
Mistral/Large 4 preview. Jev remains unversioned, with its probability/Noul lines;
Luna retains its finite-choice presentation. Preserve the existing UI data
shapes. Run lint, Svelte checks, tests, and build; inspect rendered session and
provider labels, including the longest names. This verifies synthetic
presentation, not real provider requests or account access.
