# Model catalog

Researched October 26, 2026. These are curated display labels for synthetic
sessions, not an API inventory or claims of account access. Metrics remain
invented. The catalog preserves frontier, balanced, efficient, local, open-weight,
and specialized coding roles across providers. Access restrictions belong in
this research record; the wall does not call providers or require subscriptions.

## Add

| Provider | Display label | Role and official evidence |
| --- | --- | --- |
| Z.ai | `glm-5.3-flash` | Efficient, native multimodal visual coding and agent work, distinct from the text-only GLM 5.3 flagship. The [August 26 release notes](https://docs.z.ai/release-notes/new-released) and [current model reference](https://docs.z.ai/guides/vlm/glm-5.3-flash) confirm availability and API ID `glm-5.3-flash`. Keep the flagship alongside it; omit FlashX speed variants. |

## Update

| Provider | Previous label | Display label | Basis |
| --- | --- | --- | --- |
| Moonshot | `kimi-k3` | `kimi-k3.1-pro` | Refresh the flagship coding/agent role. The [October 24 announcement](https://www.kimi.com/en/blog/kimi-k3-1-pro) describes a post-trained K3 successor available on Kimi, Work, Code, and the API; the [model reference](https://platform.kimi.ai/docs/api/models-overview) confirms ID `kimi-k3.1-pro`. Full weights are promised by November 4, not verified as released. Keep K2.7 Code as the separate coding family; omit the Highspeed variant. |
| MiniMax | `minimax-m3.1-flash-preview` | `minimax-m3.1-flash` | The [October 19 official rollout](https://www.minimax.io/blog/minimax-m31f) and [release notes](https://platform.minimax.io/docs/release-notes/models) supersede the preview label. The [current model catalog](https://platform.minimax.io/docs/guides/models-intro) and [SDK reference](https://platform.minimax.io/docs/api-reference/text-anthropic-api) list API model `MiniMax-M3.1-Flash`. Keep M3 as a separate model. |

In `PROVIDERS`, only Moonshot changes from `kimi-k3` to `kimi-k3.1-pro`.
All nine provider rows refer to session labels. Usage, reset, token, and cost
behavior remains synthetic, with the existing values and data shapes preserved.

## Keep

| Provider | Labels | Official evidence |
| --- | --- | --- |
| OpenAI | `gpt-6-astra`, `gpt-6.1-sol`, `gpt-6-luna` | [Current model catalog](https://developers.openai.com/api/docs/models): frontier, balanced, and efficient roles. [Release notes](https://help.openai.com/en/articles/9624314-model-release-notes) do not require replacing these labels. |
| Anthropic | `opus-5.5`, `sonnet-5.5`, `haiku-5.5`, `fable-5.1` | [Current lineup](https://platform.claude.com/docs/en/models/overview) and [newsroom](https://www.anthropic.com/news). Haiku retains the efficient role. |
| Google | `gemini-4-argon`, `gemini-3.8-flash` | [Model catalog](https://ai.google.dev/gemini-api/docs/models) and [October 8 changelog](https://ai.google.dev/gemini-api/docs/changelog) retain 3.8 as the current Flash model; the October 13 entry confirms Argon general availability. |
| Meta | `muse-wonder`, `muse-wonder-full`, `muse-spark-1.3`, `muse-spark-open`, `muse-glimmer` | [Current catalog](https://dev.meta.ai/docs/models) and [research releases](https://research.meta.ai/) retain frontier, efficient, and local/open-weight roles. Wonder Full remains limited to Muse Code Power Usage and Maximum Usage subscriptions. |
| xAI | `grok-4.7` | [Model catalog](https://docs.x.ai/developers/models) and [release announcement](https://x.ai/news/grok-4-7). |
| Mistral | `mistral-medium-3-5`, `mistral-large-4-preview` | [Model catalog](https://docs.mistral.ai/models) and [changelog](https://docs.mistral.ai/resources/changelogs): balanced agentic coding alongside the October 6 public-preview flagship. Keep the preview suffix; the changelog still describes weights as coming soon. |
| DeepSeek | `deepseek-v4-pro`, `deepseek-v4.1-flash` | [Official changelog](https://api-docs.deepseek.com/updates/) confirms continued Pro service and the October 17 Flash refresh. Keep the short Flash family label rather than appending its `1017` snapshot; the API alias is `deepseek-flash`. |
| Alibaba | `qwen3.8-max`, `qwen3.8-flash` | [Current catalog](https://www.alibabacloud.com/help/en/model-studio/models) and [coding recommendations updated October 15](https://www.alibabacloud.com/help/en/model-studio/text-generation-model/). |
| Moonshot | `kimi-k2.7-code` | [Current model reference](https://platform.kimi.ai/docs/api/models-overview) retains this separate coding family. |
| Z.ai | `glm-5.3` | [Provider model reference](https://docs.z.ai/guides/llm/glm-5.3); [Mistral's September 29 changelog](https://docs.mistral.ai/resources/changelogs) also lists 5.3 as the replacement for its hosted 5.2. |
| MiniMax | `minimax-m3` | [Model catalog](https://platform.minimax.io/docs/guides/models-intro) and [M3 announcement](https://www.minimax.io/blog/minimax-m3). |
| Baidu | `ernie-5.1` | [Official 5.1 announcement](https://ernie.baidu.com/blog/posts/ernie-5.1-0508-release/). |
| TypeSafe | `jev` (decision route only) | [October 14 Jev 1.14 announcement](https://typesafe.ai/blog/jev-1-14) and [model reference](https://docs.typesafe.ai/models). Keep the unversioned display label and existing choice/Noul presentation; see [decision routes](decision-routes.md). |

## Remove and exclusions

No standalone removals. Kimi K3 is replaced in the flagship role, not asserted
to be retired. Older Spark versions and high-speed variants are omitted
in favor of the current family representative. Qwen Plus, Gemini Flash-Lite,
and Mistral Small remain valid alternatives, but overlap the balanced
and efficient roles already represented. Codestral focuses on code completion;
Kimi Code already represents specialized coding sessions in this curated mix.

Image, audio, translation, embedding, and moderation models are outside the
coding-session mix. Speed tiers and reasoning efforts are settings rather than
distinct model families. Decisions API remains in the separate bounded-decision
display. Jev's experimental image, Box, and long-context capabilities do not
require new simulated scenes for this model-label refresh.

## Acceptance

The session catalog contains 28 unique labels across 12 providers. Provider usage
rows must refer to session labels, including Meta/Wonder, Google/Argon,
Mistral/Large 4 preview, and Moonshot/K3.1 Pro. Jev remains unversioned, with its
probability/Noul lines;
Luna retains its finite-choice presentation. Preserve the existing UI data
shapes. Run lint, Svelte checks, tests, and build; inspect rendered session and
provider labels, including the longest names. This verifies synthetic
presentation, not real provider requests or account access.
