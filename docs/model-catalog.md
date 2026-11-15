# Model catalog

Researched November 15, 2026. These are curated display labels for synthetic
sessions, not an API inventory or claims of account access. Metrics remain
invented. The catalog preserves frontier, balanced, efficient, local, open-weight,
and specialized coding roles across providers. Access restrictions belong in
this research record; the wall does not call providers or require subscriptions.

## Add

| Provider | Display label | Role and official evidence |
| --- | --- | --- |
| Google | `gemini-4-carbon` | Harder, long-horizon reasoning and coding. [Announced October 28](https://blog.google/innovation-and-ai/models-and-research/gemini-models/introducing-gemini-4-carbon/); [paid API availability expanded November 10](https://blog.google/innovation-and-ai/models-and-research/gemini-models/gemini-4-carbon-now-available/). Argon remains recommended for most engineering work. |
| OpenAI | `gpt-6.1-terra` | Distinct visual reasoning, computer use and scoped-code role alongside Astra, Sol and Luna. [Current model reference](https://developers.openai.com/api/docs/models/gpt-6.1-terra) and [changelog](https://developers.openai.com/api/docs/changelog). |
| Meta | `muse-ember` | Efficient execution and subagent work, distinct from the larger Spark/Wonder families and local Glimmer. [November 9 announcement](https://research.meta.ai/blog/muse-ember) and [catalog](https://dev.meta.ai/docs/models); native API ID `muse-ember-1.0`. |
| Baidu | `ernie-5.5-flash-preview` | Efficient coding/agent family alongside ERNIE 5.1. [November 11 release](https://ernie.baidu.com/release/ernie-5-5-flash-preview) and [Qianfan listing](https://cloud.baidu.com/product/qianfan_home/model_3.html). Keep the preview suffix; promised open weights are not treated as released. |

## Update

| Provider | Previous label | Display label | Basis |
| --- | --- | --- | --- |
| Google | `gemini-3.8-flash` | `gemini-4-hydrogen` | Refresh the rapid coding/agent role with the [November 12 release](https://blog.google/innovation-and-ai/technology/developers-tools/build-with-gemini-4-hydrogen/). The [model reference](https://aistudio.google.com/docs/models/gemini-4-hydrogen) lists four thinking levels. [3.8 Flash has no announced shutdown](https://aistudio.google.com/docs/deprecations); this is a curated display replacement, not an API retirement claim. |
| Anthropic | `fable-5.1` | `fable-5.2` | Refresh the ambitious technical-work role from the [November 9 announcement](https://www.anthropic.com/claude-fable-and-mythos-5-2) and [current lineup](https://platform.claude.com/docs/en/models/overview). Keep Opus/Sonnet/Haiku 5.5 for their distinct roles. |

In `PROVIDERS`, Google changes from `gemini-4-argon` to `gemini-4-carbon`.
Argon stays in the session catalog. All nine provider rows refer to session
labels; usage, reset, token and cost values remain synthetic.

## Keep

| Provider | Labels | Official evidence |
| --- | --- | --- |
| OpenAI | `gpt-6-astra`, `gpt-6.1-sol`, `gpt-6-luna` | [Current model catalog](https://developers.openai.com/api/docs/models): frontier, balanced, and efficient roles. [Release notes](https://help.openai.com/en/articles/9624314-model-release-notes) do not require replacing these labels. |
| Anthropic | `opus-5.5`, `sonnet-5.5`, `haiku-5.5` | [Current lineup](https://platform.claude.com/docs/en/models/overview) and [newsroom](https://www.anthropic.com/news). Haiku retains the efficient role. |
| Google | `gemini-4-argon` | [Current catalog](https://aistudio.google.com/docs/models) and [release notes](https://aistudio.google.com/docs/changelog) retain this general engineering role alongside Carbon and Hydrogen. |
| Meta | `muse-wonder`, `muse-wonder-full`, `muse-spark-1.3`, `muse-spark-open`, `muse-glimmer` | [Current catalog](https://dev.meta.ai/docs/models) and [research releases](https://research.meta.ai/) retain frontier, efficient, and local/open-weight roles. Wonder Full remains limited to Muse Code Power Usage and Maximum Usage subscriptions. |
| xAI | `grok-4.7` | [Model catalog](https://docs.x.ai/developers/models) and [release announcement](https://x.ai/news/grok-4-7). |
| Mistral | `mistral-medium-3-5`, `mistral-large-4-preview` | [Model catalog](https://docs.mistral.ai/models) and [changelog](https://docs.mistral.ai/resources/changelogs): balanced agentic coding alongside the October 6 public-preview flagship. Keep the preview suffix; the changelog still describes weights as coming soon. |
| DeepSeek | `deepseek-v4-pro`, `deepseek-v4.1-flash` | [Official changelog](https://api-docs.deepseek.com/updates/) confirms continued Pro service and the October 17 Flash refresh. Keep the short Flash family label rather than appending its `1017` snapshot; the API alias is `deepseek-flash`. |
| Alibaba | `qwen3.8-max`, `qwen3.8-flash` | [Current catalog](https://www.alibabacloud.com/help/en/model-studio/models) and [coding recommendations updated October 15](https://www.alibabacloud.com/help/en/model-studio/text-generation-model/). |
| Moonshot | `kimi-k2.7-code`, `kimi-k3.1-pro` | [Current model reference](https://platform.kimi.ai/docs/api/models-overview) retains the coding family and K3.1 Pro flagship. Its [announcement](https://www.kimi.com/en/blog/kimi-k3-1-pro) promised weights by November 4; publication was not independently verified in this audit. |
| Z.ai | `glm-5.3`, `glm-5.3-flash` | [Provider model reference](https://docs.z.ai/guides/llm/glm-5.3); [Mistral's September 29 changelog](https://docs.mistral.ai/resources/changelogs) also lists 5.3 as the replacement for its hosted 5.2. |
| MiniMax | `minimax-m3`, `minimax-m3.1-flash` | [Model catalog](https://platform.minimax.io/docs/guides/models-intro) and [M3 announcement](https://www.minimax.io/blog/minimax-m3). |
| Baidu | `ernie-5.1` | [Official 5.1 announcement](https://ernie.baidu.com/blog/posts/ernie-5.1-0508-release/). |
| TypeSafe | `jev` (decision route only) | [October 14 Jev 1.14 announcement](https://typesafe.ai/blog/jev-1-14) and [model reference](https://docs.typesafe.ai/models). Keep the unversioned display label and existing choice/Noul presentation; see [decision routes](decision-routes.md). |

## Remove and exclusions

No standalone removals. Flash and Fable leave only through the role replacements above. Older Spark versions and high-speed variants are omitted
in favor of the current family representative. Qwen Plus, Gemini Flash-Lite,
and Mistral Small remain valid alternatives, but overlap the balanced
and efficient roles already represented. Codestral focuses on code completion;
Kimi Code already represents specialized coding sessions in this curated mix.

[Qwen4-Max-Preview](https://www.alibabacloud.com/help/en/model-studio/qwen4-max-preview)
is Token Plan-only and is scheduled to retire after November 25, 2026. Keep
Qwen 3.8 Max/Flash rather than adding an expiring default. Grok Build 0.1 is a
[verified older coding family](https://x.ai/news/grok-build-0-1), retained as an
optional catalog backfill outside this approved refresh. Restricted Mythos,
research/cyber-only models, rumored Gemini element names and post-training base
models are excluded. No unannounced replacement or weight release is assumed.

Image, audio, translation, embedding and moderation models are outside the
coding-session mix. Thinking levels, fast modes and Antigravity Orchestrator
are settings or product modes rather than distinct models. See
[bounded decision routes](decision-routes.md) for Google, OpenAI, TypeSafe and
Microsoft; those models do not enter the normal session catalog.

## Ecosystem evidence

Google GenAI JavaScript/Python SDK 3.2 added Decisions support. AI SDK documents
an experimental decision abstraction; LangChain documents a classifier;
OpenRouter and OpenCode list decision routes. LiteLLM documents its Gemini
implementation as merged to main but not yet released. These are integration
and release observations, not live compatibility tests. Relevant primary links:
[SDK releases](https://github.com/googleapis/js-genai/releases),
[AI SDK](https://ai-sdk.dev/providers/ai-sdk-providers/google#decision-models),
[LangChain](https://docs.langchain.com/oss/python/integrations/providers/google),
[LiteLLM](https://docs.litellm.ai/docs/providers/gemini#decisions),
[OpenCode](https://opencode.ai/docs/console/models/).

Public discussions and exposed replies showed both positive coding anecdotes
and hallucination/configuration caveats. A small Decision routing test reported
confident out-of-scope classification without an escape option; Google's own
best practices support scope checks. These observations do not establish
universal quality or latency. Sources: [test and replies](https://www.reddit.com/r/GeminiAI/comments/1xtv78f/tested_gemini_decision_1_on_the_free_tier_3030/),
[Hydrogen discussion and dissent](https://www.reddit.com/r/GeminiAI/comments/1xwbrj9/gemini_4_hydrogen_better_than_claude_sonnet_and/).

## Acceptance

The catalog has 32 unique session labels across 12 providers. All provider rows
must resolve to session labels, including Google/Carbon; Argon remains available.
Verify all four decision routes independently. Preserve tool lifecycle, recent
results and timing. Run lint, Svelte checks, tests and build, and inspect long
rendered names. This validates synthetic presentation, not account access or
real provider requests. No provider SDK is installed by this refresh.
