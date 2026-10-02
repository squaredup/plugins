Monitor your [OpenRouter](https://openrouter.ai) spend, usage, and API keys in SquaredUp via the [OpenRouter API](https://openrouter.ai/docs/api_reference/overview). Compare models by price, benchmarks, and provider performance.

## Setup

You will need an OpenRouter **management key** for full access. A standard API key also works, but only for model, benchmark, ranking, and credit data.

| Key type | What works |
| -------- | ---------- |
| **Management key** | Everything: models, benchmarks, rankings, credits, workspaces, API keys, and usage. |
| **Standard API key** | Models, benchmarks, rankings, and credits. Workspaces, API keys, and usage are unavailable. |

Management keys can read and manage account, workspace, API key, and usage data, but cannot be used to call models. This plugin only reads data; it never creates, modifies, or deletes anything in OpenRouter.

1. Sign in to [OpenRouter](https://openrouter.ai). Organization accounts require the **Admin** role to create a management key.
2. Go to [**Settings → Management Keys**](https://openrouter.ai/settings/management-keys) and create a key. See the [management key documentation](https://openrouter.ai/docs/guides/overview/auth/management-api-keys) for details.
3. To use a standard key instead, create one under [**Settings → API Keys**](https://openrouter.ai/settings/keys). A **$0** credit limit works, so the key can read data but never spend credit.
4. Copy the key and paste it into the **API key** field.

## Configuration fields

| Field       | What it is                                                                | Where to find it                                                                  | Required |
| ----------- | ------------------------------------------------------------------------- | --------------------------------------------------------------------------------- | -------- |
| **API key** | A management key (recommended) or standard API key, sent as a Bearer token. | OpenRouter → **Settings → Management Keys** (or **Settings → API Keys**).         | Yes      |

On save, the plugin checks the key in two steps. An invalid, disabled, or expired key fails setup. A valid standard API key passes with a warning that workspaces, API keys, and usage need a management key.

## What this plugin monitors

- **Spend and usage** — spend, requests, tokens, latency, and throughput over time, broken down by model, provider, workspace, API key, or app.
- **API keys** — spend today, this week, and this month for each key, against its credit limit, plus an expiry warning.
- **Account credits** — credits purchased, used, and remaining.
- **Model comparison** — pricing, context length, modalities, and Artificial Analysis benchmark scores for every model on OpenRouter.
- **Providers** — every provider serving models on OpenRouter, with headquarters and datacenter locations.
- **Provider performance** — current status, price, uptime, latency, and throughput for each provider serving a model.
- **Benchmarks and rankings** — scores from Artificial Analysis, Design Arena, and OpenRouter's own evals, OpenRouter's public leaderboard of the most used models, what share of OpenRouter traffic goes to each kind of task, what a coding-agent session typically costs, and which public apps use OpenRouter most.

The out-of-the-box dashboards include an account **Overview**; **Model Comparison** and **OpenRouter Ecosystem** dashboards covering models, apps, task types, and providers across all of OpenRouter, which work with a standard API key; and a perspective for each **Model**, **Provider**, **Workspace**, and **API Key** (spend tiles need a management key). The Model perspective includes a current view of each provider's status, price, and throughput.

## Data streams

- **Usage** — spend, requests, tokens, cache hit rate, latency, time to first token, or throughput over time, optionally grouped by model, provider, workspace, API key, app, user, origin, country, finish reason, or streamed, and optionally filtered to selected models, providers, workspaces, or API keys. Any other OpenRouter analytics metric or dimension can be typed in. Account-wide. Management key only.
- **API Keys** — API keys in a workspace with spend and limits. Per workspace. Management key only.
- **Workspaces** — workspaces in the account. Account-wide. Management key only.
- **Credits** — credits purchased, used, and remaining. Account-wide.
- **Models** — every model on OpenRouter with pricing ($ per 1M tokens), context length, modalities, and Artificial Analysis index scores, optionally filtered to selected models.
- **Providers** — every provider on OpenRouter, with headquarters and datacenter countries (by name), and status, privacy, and terms links.
- **Model Providers** — providers serving a model, with status, price (including cache reads), uptime over the last 5 minutes, 30 minutes, and day, and latency (p50 to p99) and throughput over the last 30 minutes. Per model.
- **Benchmarks** — model benchmark scores from Artificial Analysis, Design Arena, and OpenRouter evals, one row per model and benchmark.
- **Model Rankings** — the most used models across all OpenRouter traffic, by tokens processed per day, week, or month, optionally narrowed to a use case, language type, modality, or context length. Optionally keep only each period's top models and combine the rest into **Other**, as OpenRouter's own rankings chart does.
- **App Rankings** — the top 100 public apps on OpenRouter by tokens, ranked by most tokens or by trending growth, optionally filtered to a category or subcategory (such as CLI agents or roleplay).
- **Session Cost** — median cost of one coding-agent session routed through OpenRouter, by harness (such as Claude Code or Codex), model, and session length (1 turn to 50+ turns), optionally filtered to a harness, session length, or selected models. Refreshed weekly by OpenRouter.
- **Task Classifications** — share of all OpenRouter requests and tokens by task type (such as code generation or summarization) over the last 7 days, grouped into Code, Data, Agent, and General, with each task's most used model.

## What gets indexed

| Object type   | API source                      | Represents                                                               |
| ------------- | ------------------------------- | ------------------------------------------------------------------------ |
| **Model**     | `GET /models`                   | A model available through OpenRouter, such as `anthropic/claude-sonnet-4.5`. |
| **Provider**  | `GET /providers`                | A provider serving models through OpenRouter, such as `Groq`.                 |
| **Workspace** | `GET /workspaces`               | A workspace in the account. Management key only.                         |
| **API Key**   | `GET /keys` (per workspace)     | An API key in a workspace, including its expiry date. Management key only. |

**Relationships:** each API Key records the ID of its Workspace.

With a standard API key, only models and providers are imported; the workspace and API key import steps are skipped with a warning.

## Known limitations

- **Benchmarks, rankings, app rankings, task classifications, and session costs refresh at most once a day** — OpenRouter limits these endpoints to 500 requests a day per account, so the plugin caches them for 24 hours.
- **Rankings licence** — rankings, app ranking, task classification, session cost, and benchmark data is published by OpenRouter under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). Each row of these streams has a hidden **Citation** column with the exact attribution OpenRouter requires, and a hidden **As Of** date. The **Model Comparison**, **OpenRouter Ecosystem**, and **Model** dashboards credit the data already; show the citation on any dashboard you build from it.
- **Not every model has benchmark scores** — Artificial Analysis scores cover fewer than half of models; the rest show blank.
- **Usage history** can be queried up to a year back. Latency, time to first token, throughput, and grouping by **Provider**, **Origin**, **Country**, **Finish reason**, or **Streamed** are limited to 31 days; longer timeframes return an error.
- **Usage timeframes start at 12 hours** — data is bucketed by hour, day, week, or month to suit the range; periods with no activity are left out rather than shown as zero.
- **Large usage queries may be truncated** — the stream warns when this happens; narrow the timeframe or filter to specific objects.
- **Model rankings start at 7 days** — the data is daily. Use case and language segments are weekly estimates from sampled traffic, so they're shown weekly even when **Day** is selected.
- **Task classifications cover the last 7 days only** — they come from a sample of OpenRouter traffic, so only shares are available, not request or token counts.
- **Provider status is inferred** — OpenRouter doesn't document its endpoint status codes. The plugin shows `0` as healthy, `-1` to `-3` as warning, and anything lower as error, which matches the uptime OpenRouter reports for those endpoints; check **Uptime (5m)** alongside it.
- **Provider performance is a live snapshot** — it covers the last 5 minutes to 1 day, with no history beyond what SquaredUp records.
- **Filtering usage needs imported objects** — pick models, providers, workspaces, or API keys in **Filter to objects (optional)**; grouped results show their names. Filtering by provider is limited to 31 days.
- **Organization members aren't imported.**
- **Read-only** — the plugin never creates, modifies, or deletes anything in OpenRouter.
