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

- **Spend and usage** — spend, requests, and tokens over time, broken down by model, provider, workspace, API key, or app.
- **API keys** — spend today, this week, and this month for each key, against its credit limit, plus an expiry warning.
- **Account credits** — credits purchased, used, and remaining.
- **Model comparison** — pricing, context length, modalities, and Artificial Analysis benchmark scores for every model on OpenRouter.
- **Provider performance** — price, uptime, latency, and throughput for each provider serving a model.
- **Benchmarks and rankings** — scores from Artificial Analysis, Design Arena, and OpenRouter's own evals, and OpenRouter's public leaderboard of the most used models.

The out-of-the-box dashboards include an account **Overview**, a **Model Comparison** dashboard (which works with a standard API key), and a perspective for each **Model**, **Workspace**, and **API Key** (spend tiles need a management key).

## Data streams

- **Usage** — spend, requests, tokens, or cache hit rate over time, optionally grouped by model, provider, workspace, API key, or app, and optionally filtered to selected objects. Account-wide. Management key only.
- **API Keys** — API keys in a workspace with spend and limits. Per workspace. Management key only.
- **Workspaces** — workspaces in the account. Account-wide. Management key only.
- **Credits** — credits purchased, used, and remaining. Account-wide.
- **Models** — every model on OpenRouter with pricing ($ per 1M tokens), context length, modalities, and Artificial Analysis index scores, optionally filtered to selected models.
- **Model Providers** — providers serving a model, with price, uptime, latency, and throughput over the last 30 minutes. Per model.
- **Benchmarks** — model benchmark scores from Artificial Analysis, Design Arena, and OpenRouter evals, one row per model and benchmark.
- **Model Rankings** — the most used models across all OpenRouter traffic, by tokens processed per day.

## What gets indexed

| Object type   | API source                      | Represents                                                               |
| ------------- | ------------------------------- | ------------------------------------------------------------------------ |
| **Model**     | `GET /models`                   | A model available through OpenRouter, such as `anthropic/claude-sonnet-4.5`. |
| **Workspace** | `GET /workspaces`               | A workspace in the account. Management key only.                         |
| **API Key**   | `GET /keys` (per workspace)     | An API key in a workspace, including its expiry date. Management key only. |

**Relationships:** each API Key records the ID of its Workspace.

With a standard API key, only models are imported; the workspace and API key import steps are skipped with a warning.

## Known limitations

- **Benchmarks and rankings refresh at most once a day** — OpenRouter limits these endpoints to 500 requests a day per account, so the plugin caches them for 24 hours.
- **Rankings licence** — rankings data is published by OpenRouter under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). The **Model Comparison** dashboard credits it already; keep "Source: OpenRouter (openrouter.ai/rankings)" on any dashboard you build from it.
- **Not every model has benchmark scores** — Artificial Analysis scores cover fewer than half of models; the rest show blank.
- **Usage history** can be queried up to a year back. Grouping usage by **Provider** is limited to 31 days; longer timeframes return an error.
- **Usage timeframes start at 12 hours** — data is bucketed by hour, day, week, or month to suit the range; periods with no activity are left out rather than shown as zero.
- **Large usage queries may be truncated** — the stream warns when this happens; narrow the timeframe or filter to specific objects.
- **Model rankings start at 7 days** — the data is daily.
- **Provider performance is a live snapshot** — it covers the last 30 minutes, with no history beyond what SquaredUp records.
- **Filtering usage needs imported objects** — pick workspaces and API keys in **Filter to objects (optional)**; grouped results show their names.
- **Organization members aren't imported.**
- **Read-only** — the plugin never creates, modifies, or deletes anything in OpenRouter.
