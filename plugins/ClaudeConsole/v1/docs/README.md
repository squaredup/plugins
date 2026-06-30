# Before you start

Monitor your [Claude Console](https://platform.claude.com/) (Anthropic developer platform) organization's token usage, cost, workspaces, API keys, and members in SquaredUp, via the [Admin API](https://platform.claude.com/docs/en/api/administration-api) and [Usage & Cost API](https://platform.claude.com/docs/en/api/usage-cost-api).

> ⚠️ This plugin targets the **Claude Console** Admin API, using read-only endpoints.
> Claude **Enterprise** (claude.ai) organizations use a different Analytics API and key type, which this plugin does not support.
> Claude **Free**, **Pro**, **Max** & **Teams** cannot be monitored using this plugin.

## Setup

You will need an **Admin API key** for your Claude Console organization.

1. Sign in to the [Claude Console](https://platform.claude.com/).
2. [Create a new Admin API key](https://platform.claude.com/settings/admin-keys). It will start with **`sk-ant-admin…`** — this is different from a standard API key (`sk-ant-api…`), and a standard key will **not** work.
3. Copy the key and paste it into the **Admin API key** field.

## Configuration fields

| Field             | What it is                                                                                        | Where to find it                                                      | Required |
| ----------------- | ------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------- | -------- |
| **Admin API key** | Your organization's Admin API key, used to authenticate every request via the `x-api-key` header. | Claude Console → Settings → Admin keys (starts with `sk-ant-admin…`). | Yes      |

On save, the plugin validates the key by calling `GET /v1/organizations/me`. If the key is invalid, not an admin key, or belongs to an individual account, setup will fail with an authentication error.

## What this plugin monitors

- **Token usage** — uncached input, cache read, cache creation (5-minute and 1-hour), and output tokens, plus web-search request counts, grouped by model / workspace / API key / member / service tier / context window over a chosen time range.
- **Cost** — daily spend in USD, broken down by model, token type, cost type (tokens / web search / code execution / session usage), and workspace.
- **Workspaces, API keys, and members** — imported as objects you can scope dashboards to, search, and drill into.

The out-of-the-box dashboards include an account-wide **Overview** plus a perspective for each **Workspace**, **API Key**, and **Member**.

## Data streams

- **Token Usage** — Organization token usage over time, grouped by model, workspace, API key, member, service tier, or context window.
- **Cost** — Organization spend in USD over time, with one row per workspace / model / token-type bucket per day.
- **Workspaces** — Workspaces in your Claude Console organization.
- **API Keys** — API keys in your organization, including status, redacted hint, creator, and owning workspace.
- **Members** — Organization members, with email, name, and role.
- **Organization** — Your Claude Console organization id, name, and type.

## What gets indexed

| Object type   | API source                         | Represents                                                                                                      |
| ------------- | ---------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| **Workspace** | `GET /v1/organizations/workspaces` | A workspace in your organization — the container for API keys and the primary cost/usage attribution dimension. |
| **API Key**   | `GET /v1/organizations/api_keys`   | An API key, including its status, partially-redacted hint, creating user, and owning workspace.                 |
| **Member**    | `GET /v1/organizations/users`      | An organization member, including email, name, and organization role.                                           |

**Relationships:** each API Key links to its owning Workspace and to the Member who created it.

## Known limitations

- **Admin/organization access required** — see [Setup](#setup). Individual accounts and Enterprise/claude.ai organizations are not supported.
- **Cost is daily-granularity only.** The Cost API only returns daily (`1d`) buckets, so cost dashboards are limited to ranges up to ~31 days (last 7 days, last 30 days, this month, last month). Quarter/year ranges are not offered.
- **Usage time granularity is capped by the API.** The Usage API limits a single response to 31 daily, 168 hourly, or 1440 minute buckets, so usage timeframes are limited to ranges up to ~31 days. The bucket width is chosen automatically from the selected timeframe.
- **Priority Tier costs** are billed differently and are not included in the Cost API; track Priority Tier through token usage instead.
- **Data freshness** — usage and cost data typically appears within ~5 minutes of an API request completing.
- **Large organizations (>1000 objects).** Workspaces, API keys, and members are each imported up to 1000 per type; organizations with more than 1000 of any one type have the remainder omitted.
- **Read-only.** This plugin only reads data; it does not create, modify, or delete any Anthropic resources.
