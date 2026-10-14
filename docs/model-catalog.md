# Model catalog

Researched October 1, 2026. These are curated display labels for synthetic
sessions, not an API inventory or claims of account access. Metrics remain
invented. The catalog preserves frontier, balanced, efficient, and specialized
coding roles across providers.

## Update

| Provider | Previous label | Display label | Basis |
| --- | --- | --- | --- |
| OpenAI | `gpt-6-sol` | `gpt-6.1-sol` | [September 29 announcement](https://openai.com/index/introducing-gpt-6-1-sol/) and [API model page](https://developers.openai.com/api/docs/models/gpt-6.1-sol). Replace the balanced workhorse in both the session catalog and provider usage display. |
| Anthropic | `sonnet-5` | `sonnet-5.5` | [Current lineup](https://platform.claude.com/docs/en/models/overview) and [Sonnet 5.5](https://platform.claude.com/docs/en/models/sonnet-5-5/overview). Replace the speed/intelligence role in the session catalog. |

## Keep

| Provider | Labels | Official evidence |
| --- | --- | --- |
| OpenAI | `gpt-6-astra`, `gpt-6-luna` | [Astra](https://developers.openai.com/api/docs/models/gpt-6-astra), [Luna](https://developers.openai.com/api/docs/models/gpt-6-luna): frontier and efficient roles remain distinct from Sol. |
| Anthropic | `opus-5.5`, `fable-5.1` | [Current lineup](https://platform.claude.com/docs/en/models/overview): general agentic work and demanding reasoning. |
| Google | `gemini-3.1-pro`, `gemini-3.8-flash` | [Model catalog](https://ai.google.dev/gemini-api/docs/models): Pro and Flash roles. |
| xAI | `grok-4.7` | [September 21 announcement](https://x.ai/news/grok-4-7). |
| Mistral | `mistral-medium-3-5` | [Model page](https://docs.mistral.ai/models/mistral-medium-3-5-26-04): agentic and coding model. |
| DeepSeek | `deepseek-v4-pro`, `deepseek-v4.1-flash` | [Model list](https://api-docs.deepseek.com/api/list-models/) and [continued Pro service](https://api-docs.deepseek.com/quick_start/pricing-details-cny/). |
| Alibaba | `qwen3.8-max`, `qwen3.8-flash` | [Model catalog](https://www.alibabacloud.com/help/en/model-studio/models). |
| Moonshot | `kimi-k3`, `kimi-k2.7-code` | [K3 model card](https://github.com/MoonshotAI/Kimi-K3/blob/main/README.md), [coding model card](https://huggingface.co/moonshotai/Kimi-K2.7-Code). |
| Z.ai | `glm-5.3` | [Provider model repository](https://github.com/zai-org/GLM-5/blob/main/README.md). |
| MiniMax | `minimax-m3` | [M3 announcement](https://www.minimax.io/blog/minimax-m3). |
| Baidu | `ernie-5.1` | [5.1 announcement](https://ernie.baidu.com/blog/posts/ernie-5.1-0508-release/). |

## Add, remove, and exclusions

No additions or removals in this refresh. Haiku 4.5 is an additional efficient
family, but its published retirement floor is October 15, 2026; Luna, Flash,
and Qwen Flash already cover efficient routes. Speed tiers and reasoning efforts
are settings rather than distinct model families. Image, audio, translation,
embedding, and moderation models are outside the coding-session mix. Decisions
API belongs to the separate bounded-decision display, not this session catalog.

## Acceptance

Both session labels and the OpenAI provider usage label must show Sol 6.1.
Sonnet sessions must show Sonnet 5.5. Keep the provider mix and data shapes.
Run lint, Svelte checks, tests, and build; inspect rendered session and provider
labels. This verifies synthetic presentation, not real provider requests.
