# Sanity

Bring your [Sanity](https://www.sanity.io) content into SquaredUp. A single plugin instance can cover **many Sanity projects** at once: it lists the projects your admin token can see, and — for each project you supply an API token for — lets you browse datasets, run GROQ queries, break content down by document type, and see a full **history of changes**.

## What this plugin does

You give the plugin two things: an **admin token** (used to list projects, datasets and members across your organization) and a set of **per-project API tokens** (used to query each project's content). It then imports:

- **Each project** your admin token can see, as a `Sanity Project` object you can scope dashboards to and drill into.

From there you get data streams for:

- **Change history** — a project/dataset's transaction log: who changed what and when, over any dashboard timeframe.
- **Document type counts** — how many documents of each `_type` live in a dataset.
- **Custom GROQ query** — run any GROQ query against a dataset straight from a tile.
- **Datasets** — a table of a project's datasets and their access modes.
- **Members** (optional) — the people with access to a project and their roles.

## Why two kinds of token?

Sanity uses two API surfaces:

- **Management** (`api.sanity.io`) — listing projects, datasets and members. The plugin uses your **admin token** here.
- **Content** (`<projectId>.api.sanity.io`) — GROQ queries and history. The plugin uses the **per-project token** matching the project being queried.

This keeps content access least-privilege: each project's token can only read that project. The query and history tiles work for any project you've added a token for; projects without a token still appear (with their datasets/members via the admin token) but their query/history tiles will show an authorization error.

## Prerequisites — getting your credentials

### Admin API token

1. Sign in to [sanity.io/manage](https://www.sanity.io/manage).
2. Choose an organization-level or project token with enough access to list the projects you care about. A **personal token** (from an admin account) or an organization token works well. To also populate the optional **Members** tile, the token needs member-read access (an Administrator/personal token).
3. If creating a project token: open a project → **API → Tokens → Add API token**, and copy the value (shown once).

### Project IDs and per-project tokens

For **each** project you want to query content in:

1. In [sanity.io/manage](https://www.sanity.io/manage), open the project.
2. Note the **Project ID** — an 8-character string shown on the project page and in its URL (`…/manage/project/<projectId>`).
3. Go to **API → Tokens → Add API token**, choose the **Viewer** role (read-only), and copy the token value.

> **Private datasets** require a token; **public** datasets can be queried without one, but a token is still recommended.

## Configuration fields

| Field | What it is | Where to find it | Required |
|---|---|---|---|
| **Admin API token** | Token used for management calls (listing projects, datasets, members) | sanity.io/manage → API → Tokens (or a personal/admin token) | Yes |
| **Project API tokens** | A list of **Project ID → API token** pairs, one per project you want to query | Project ID from the project page; Viewer token from API → Tokens | Yes |
| **Content API version** | The dated Sanity API version used for GROQ/history (advanced) | Defaults to `v2025-02-19`; leave as-is unless you need a specific version | No |

## What gets indexed

| Object type | Represents | Example |
|---|---|---|
| **Sanity Project** | A project your admin token can see | `My Studio (abc12xyz)` |

Datasets are **not** indexed as objects (Sanity has no cross-project datasets endpoint). Instead, each project's datasets appear as a table, and you choose a dataset via the **dataset** parameter on the query, history and document-count tiles.

## Known limitations

- **No usage or billing metrics.** Sanity's HTTP API exposes no API-request counts, bandwidth, storage, or plan/quota figures.
- **Content tiles need a per-project token.** Query, history and document-count tiles for a project only work if you've added that project's token under **Project API tokens**.
- **Document type counts read document metadata.** The breakdown comes from a GROQ query returning each document's `_type`; on very large datasets it can be slow — scope it to specific types if needed.
- **Change history depth.** The transaction log is fetched per dashboard timeframe with a capped number of transactions per request; very busy windows may be truncated to the most recent transactions.
- **Members tile permissions.** Requires the admin token to have member-read access; otherwise the tile shows an authorization error and nothing else is affected.

## Useful links

- [Sanity HTTP API reference](https://www.sanity.io/docs/http-reference)
- [GROQ query language](https://www.sanity.io/docs/groq)
- [Manage your Sanity projects](https://www.sanity.io/manage)
