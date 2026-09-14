Bring your [Sanity](https://www.sanity.io) content into SquaredUp: index projects, datasets and members, run GROQ queries, and watch dataset usage against plan limits, via the [Sanity HTTP API](https://www.sanity.io/docs/http-api).

## Setup

Sanity uses two separate credentials: an **admin token**, used only to look up project display names and creation dates, and a **per-project token** for each project you want to monitor, used to read that project's datasets, members and content. Only projects you add a per-project token for are imported — this keeps content access least-privilege, since each project's token can only read that project.

### Admin API token

1. Sign in to [sanity.io/manage](https://www.sanity.io/manage).
2. Use an **organization token** or a **personal token from an admin account** — a project-scoped token cannot list all the projects in your organization.
3. Create the token under your organization (or account) settings → **API → Tokens → Add API token**, and copy the value (shown once).
4. Paste this token into the **Admin API token** field.

### Project API tokens

For **each** project you want to monitor:

1. In [sanity.io/manage](https://www.sanity.io/manage), open the project.
2. Note the **Project ID** — an 8-character string shown on the project page and in its URL (`…/manage/project/<projectId>`).
3. Go to **API → Tokens → Add API token**, choose the **Viewer** role (read-only), and copy the token value.
4. Paste the **Project ID** and the token as a pair into the **Project API tokens** field — add one pair per project you want to monitor.

## Configuration fields

| Field                   | What it is                                                                                                      | Where to find it                                                          | Required |
| ----------------------- | --------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- | -------- |
| **Admin API token**     | Token used to list the projects in your organization                                                            | sanity.io/manage → API → Tokens (or a personal/admin token)               | Yes      |
| **Project API tokens**  | A list of **Project ID → API token** pairs, one per project you want to read datasets, members and content from | Project ID from the project page; Viewer token from API → Tokens          | Yes      |
| **Content API version** | The dated Sanity API version used for GROQ queries (advanced)                                                   | Defaults to `v2025-02-19`; leave as-is unless you need a specific version | No       |

## What this plugin monitors

A single plugin instance can cover **many Sanity projects** at once: it indexes each project you've supplied a token for, plus that project's datasets.

- **Projects** — every project you've configured a token for. Imported as objects.
- **Datasets** — a project's datasets and their access modes, imported as objects you can scope dashboards to and drill into.
- **Members** — the people with access to a project and their roles.
- **Custom GROQ query** — run any GROQ query against a dataset straight from a tile (the out-of-the-box dashboard uses this to break a dataset down by document type).
- **Dataset stats** — a dataset's usage figures and how close it is to plan limits.

The out-of-the-box dashboards include an organization-wide **Overview** plus a **Projects** and **Dataset** perspective.

## Data streams

- **All Projects** — every project in the organization, flagging whether it has an API token configured; account-wide.
- **Datasets** — a project's datasets and their access-control mode; per project.
- **Members** — the people with access to a project and their roles; per project.
- **Dataset Stats** — a dataset's usage figures and how close it is to plan limits; per dataset.
- **Custom GROQ Query** — runs an arbitrary GROQ query against a dataset; per dataset.

## What gets indexed

| Object type | API source                                       | Represents                                          |
| ----------- | ------------------------------------------------- | ---------------------------------------------------- |
| **Project** | `GET /v2021-06-07/projects`                       | A project you've configured an API token for.       |
| **Dataset** | `GET /v2021-06-07/projects/{projectId}/datasets`  | A dataset in a project you've supplied a token for. |

**Relationships:** each Dataset links to its parent Project.

## Known limitations

- **No organization-level usage or billing metrics.** Sanity's HTTP API exposes no API-request counts, bandwidth, or billing figures; the **Dataset stats** stream covers per-dataset usage against plan limits.
- **Only projects with a configured token are indexed.** Projects missing a token are skipped entirely, along with their datasets — this isn't an error; add the project's ID and API token under **Project API tokens** and re-import to bring it in. If a configured token is invalid or expired, tiles show an error naming the affected project.
- **Document type counts can be slow on large datasets.** The out-of-the-box breakdown tile groups every document by `_type` in GROQ; on very large datasets it can be slow — narrow the query to specific types if needed.
