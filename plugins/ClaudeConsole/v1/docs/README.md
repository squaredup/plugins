# Claude Console

Monitor your organization's **Claude Console** (Anthropic) usage, spend, and administrative resources in SquaredUp using the [Anthropic Admin API](https://platform.claude.com/docs/en/api/administration-api) and [Usage & Cost API](https://platform.claude.com/docs/en/api/usage-cost-api).

This plugin imports your workspaces, API keys, and organization members into the SquaredUp graph, and provides data streams for token usage and cost — broken down by model, workspace, API key, member, and service tier, over time.

## What this plugin monitors

- **Token usage** — uncached input, cache read, cache creation (5-minute and 1-hour), and output tokens, plus web-search request counts, grouped by model / workspace / API key / member / service tier / context window over a chosen time range.
- **Cost** — daily spend in USD, broken down by model, token type, cost type (tokens / web search / code execution / session usage), and workspace.
- **Workspaces, API keys, and members** — imported as objects you can scope dashboards to, search, and drill into.

The out-of-the-box dashboards include an account-wide **Overview** plus a perspective for each **Workspace**, **API Key**, and **Member**.

## Prerequisites — getting an Admin API key

> ⚠️ **The Admin API is unavailable for individual accounts.** You need an Anthropic **organization** (Console → Settings → Organization) and the **admin**, **owner**, or **primary owner** role.

1. Sign in to the [Claude Console](https://console.anthropic.com/).
2. Go to **Settings → Admin keys** (see [Create an Admin API key](https://platform.claude.com/docs/en/manage-claude/admin-api-keys)).
3. Create a new Admin API key. It will start with **`sk-ant-admin…`** — this is different from a standard API key (`sk-ant-api…`) and a standard key will **not** work.
4. Copy the key somewhere safe; you will paste it into SquaredUp during setup.

> **Note:** This plugin targets the **Claude Console (Claude Platform)** Admin API. Claude **Enterprise** (claude.ai) organizations use a different Analytics API and key type, which this plugin does not support. The programmatic Usage & Cost API is also not currently available on Claude Platform on AWS.

## Configuration fields

| Field | What it is | Where to find it | Required |
| --- | --- | --- | --- |
| **Admin API Key** | Your organization's Admin API key, used to authenticate every request via the `x-api-key` header. | Claude Console → Settings → Admin keys (starts with `sk-ant-admin…`). | Yes |

On save, the plugin validates the key by calling `GET /v1/organizations/me`. If the key is invalid, not an admin key, or belongs to an individual account, setup will fail with an authentication error.

## What gets indexed

| Object type | API source | Represents |
| --- | --- | --- |
| **Claude Workspace** | `GET /v1/organizations/workspaces` | A workspace in your organization — the container for API keys and the primary cost/usage attribution dimension. |
| **Claude API Key** | `GET /v1/organizations/api_keys` | An API key, including its status, partially-redacted hint, creating user, and owning workspace. |
| **Claude Member** | `GET /v1/organizations/users` | An organization member, including email, name, and organization role. |

**Relationships:** each API Key links to its owning Workspace and to the Member who created it.

## Known limitations

- **Admin/organization access required** — see Prerequisites. Individual accounts and Enterprise/claude.ai organizations are not supported.
- **Cost is daily-granularity only.** The Cost API only returns daily (`1d`) buckets, so cost dashboards are limited to ranges up to ~31 days (last 7 days, last 30 days, this month, last month). Quarter/year ranges are not offered.
- **Usage time granularity is capped by the API.** The Usage API limits a single response to 31 daily, 168 hourly, or 1440 minute buckets, so usage timeframes are limited to ranges up to ~31 days. The bucket width is chosen automatically from the selected timeframe.
- **Default-workspace attribution.** Usage and cost incurred against the *default* workspace (and Console/Workbench usage with no API key) are reported by the API with a `null` workspace/API-key — they appear as unattributed rather than under a named workspace object.
- **Priority Tier costs** are billed differently and are not included in the Cost API; track Priority Tier through token usage instead.
- **Data freshness** — usage and cost data typically appears within ~5 minutes of an API request completing.
- **Large organizations (>1000 objects).** Workspaces, API keys, and members are imported up to 1000 of each per type; organizations with more than 1000 of any one type would have the remainder omitted.
- **Read-only.** This plugin only reads data; it does not create, modify, or delete any Anthropic resources.
