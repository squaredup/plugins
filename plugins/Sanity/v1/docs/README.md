# Sanity

Bring your [Sanity](https://www.sanity.io) content into SquaredUp. A single plugin instance can cover **many Sanity projects** at once: it indexes the projects your admin token can see — plus each project's datasets and members — and lets you run GROQ queries, break content down by document type, and watch dataset usage against plan limits.

## What this plugin does

You give the plugin two things: an **admin token** (used to look up project details in your organization) and a set of **per-project API tokens** (used to read each project's datasets, members and content). It then imports:

- **Each project you've supplied a token for**, as a `Project` object. Projects without a token are not indexed — they couldn't serve any data, so you can't scope dashboards to them by mistake.
- **Each dataset** in those projects, as a `Dataset` object you can scope dashboards to and drill into.
- **Each member** of those projects, as a `Member` object.

From there you get data streams for:

- **Custom GROQ query** — run any GROQ query against a dataset straight from a tile (the out-of-the-box dashboard uses this to break a dataset down by document type).
- **Dataset stats** — a dataset's usage figures and how close it is to plan limits.
- **Datasets** — a table of a project's datasets and their access modes.
- **Members** — the people with access to a project and their roles.

## Why two kinds of token?

Sanity uses two API surfaces:

- **Management** (`api.sanity.io`) — the plugin uses your **admin token** to list projects, and the matching **per-project token** to list each project's datasets and members.
- **Content** (`<projectId>.api.sanity.io`) — GROQ queries and dataset stats. The plugin uses the **per-project token** matching the project being queried.

This keeps content access least-privilege: each project's token can only read that project. Only projects you've added a token for are indexed, so every project you can scope a dashboard to can actually serve data.

## Prerequisites — getting your credentials

### Admin API token

1. Sign in to [sanity.io/manage](https://www.sanity.io/manage).
2. Choose an organization-level or project token with enough access to list the projects you care about. A **personal token** (from an admin account) or an organization token works well.
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
| **Admin API token** | Token used to list the projects in your organization | sanity.io/manage → API → Tokens (or a personal/admin token) | Yes |
| **Project API tokens** | A list of **Project ID → API token** pairs, one per project you want to read datasets, members and content from | Project ID from the project page; Viewer token from API → Tokens | Yes |
| **Content API version** | The dated Sanity API version used for GROQ queries (advanced) | Defaults to `v2025-02-19`; leave as-is unless you need a specific version | No |

## What gets indexed

| Object type | Represents | Example |
|---|---|---|
| **Project** | A project you've configured an API token for | `My Studio` |
| **Dataset** | A dataset in a project you've supplied a token for | `My Studio - production` |
| **Member** | A user with access to one of those projects | `Jane Doe` |

Projects without a per-project token are skipped entirely — add a project's token to bring it (and its datasets and members) into the index on the next import.

## Out-of-the-box dashboards

- **Overview** — organization-wide summary: project, dataset and document counts, total JSON stored, every project in the organization with whether its API token is configured, documents by dataset, and how close each dataset is to its plan limits.
- **Projects** — a per-project drilldown (pick the project via the dashboard variable): project details, its datasets and its members.
- **Dataset** — a per-dataset drilldown (pick the dataset via the dashboard variable): details, document type breakdown, usage gauges showing how close the dataset is to its plan limits, and a customisable GROQ query tile.

## Known limitations

- **No organization-level usage or billing metrics.** Sanity's HTTP API exposes no API-request counts, bandwidth, or billing figures; the **Dataset stats** stream covers per-dataset usage against plan limits.
- **Only projects with a configured token are indexed.** Projects missing from dashboards aren't an error — add the project's ID and API token under **Project API tokens** and re-import. If a configured token is invalid or expired, tiles show an error naming the affected project.
- **Document type counts can be slow on large datasets.** The out-of-the-box breakdown tile groups every document by `_type` in GROQ; on very large datasets it can be slow — narrow the query to specific types if needed.

## Useful links

- [Sanity HTTP API reference](https://www.sanity.io/docs/http-reference)
- [GROQ query language](https://www.sanity.io/docs/groq)
- [Manage your Sanity projects](https://www.sanity.io/manage)
