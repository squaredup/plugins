# Anthropic Plugin

Monitor your Anthropic organisation's Claude API usage, token consumption, and costs across workspaces and API keys.

## What this plugin monitors

- **Workspaces** — Anthropic Console workspaces imported into the SquaredUp graph for scoping and drilldown.
- **API Keys** — Active API keys with their status and workspace association.
- **Token usage by model** — Input, output, and cache token consumption per model over time, at 1-minute, 1-hour, or 1-day granularity.
- **Token usage by workspace** — Cross-workspace comparison of token consumption over time.
- **Daily costs** — Cost breakdown per workspace in USD.

### Dashboards included

| Dashboard | Description |
|-----------|-------------|
| Overview | Org-wide token usage by model, daily cost by workspace, and workspace list |
| Workspace | Per-workspace token usage by model and API key list (variable-scoped) |
| API Key | Per-key token usage by model (variable-scoped) |

---

## Prerequisites

This plugin requires an **Admin API key** — not a standard API key. Admin API keys:

- Start with `sk-ant-admin...`
- Can only be created by organisation **admins**
- Are separate from developer API keys used to call Claude

> **Note:** The Admin API (and this plugin) requires an Anthropic **organisation** account. Individual accounts are not supported. Set one up at Console → Settings → Organisation.

### Getting an Admin API key

1. Sign in to the [Claude Console](https://console.anthropic.com).
2. Navigate to **Settings → Admin Keys**.
3. Click **Create Admin Key**, give it a name, and copy the key.
4. Store it securely — it is shown only once.

---

## Configuration

| Field | Description | Required |
|-------|-------------|----------|
| Admin API Key | Your `sk-ant-admin...` key from Console → Settings → Admin Keys | Yes |

---

## What gets indexed

| Object type | Source endpoint | Description |
|-------------|-----------------|-------------|
| Anthropic Workspace | `GET /v1/organizations/workspaces` | Logical groupings of API keys in your organisation |
| Anthropic API Key | `GET /v1/organizations/api_keys` | All active API keys across the organisation |

---

## Known limitations

- **Individual accounts not supported.** The Admin API requires an Anthropic organisation. Set one up at Console → Settings → Organisation.
- **Priority Tier costs excluded.** Priority Tier usage has a different billing model and does not appear in the cost endpoint. Track it via the Usage by Model stream instead.
- **Usage data latency.** Usage and cost data typically appears within 5 minutes of a request completing, though delays may occasionally be longer.
- **Bucket width limits.** The API enforces maximum bucket counts: 1 minute → max 1,440 buckets; 1 hour → max 168 buckets; 1 day → max 31 buckets. Choose the bucket width appropriate for the timeframe you are viewing.
- **Cost report is daily only.** The cost endpoint supports only `1d` granularity.
