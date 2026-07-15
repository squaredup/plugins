# PostHog

Monitor your [PostHog](https://posthog.com) product analytics in SquaredUp. This plugin imports your PostHog organizations and projects into the SquaredUp graph, and provides data streams for event volume, active users, top events, feature flags, and ad-hoc HogQL queries.

## What this plugin monitors

- **Organizations** and **Projects** are imported as objects you can scope dashboards to, search for, and drill into.
- Per-project dashboards show **event volume over time**, **active (unique) users**, the **top events** being captured, and the current state of your **feature flags**.
- A **Web Analytics** perspective mirrors PostHog's built-in web view: **unique visitors** over time, breakdowns by **device / country / referrer / browser**, **top pages**, **frustrating pages** (rage clicks, dead clicks, errors), and an **active-hours** view.
- A flexible **HogQL query** stream lets you run any SQL-style query against a project's data and chart the result.

## Prerequisites — getting a personal API key

1. Sign in to PostHog and go to **Settings → Personal API keys** (`https://us.posthog.com/settings/user-api-keys`, or the `eu.` equivalent).
2. Click **Create personal API key** and give it a name (e.g. "SquaredUp").
3. Under **Scopes**, grant **read** access to at least:
    - **Organization** (`organization:read`)
    - **Project** (`project:read`)
    - **Feature flag** (`feature_flag:read`)
    - **Query** (`query:read`)
    - **User** (`user:read`)
4. Under **Organization & project access**, allow the key to access the organizations and projects you want to monitor (or grant access to all).
5. Copy the key (it starts with `phx_`) — you will not be able to see it again.

## Configuration fields

| Field                | What it is                                                          | Where to find it                            | Required |
| -------------------- | ------------------------------------------------------------------- | ------------------------------------------- | -------- |
| **Region**           | The PostHog Cloud region your account is hosted in (US or EU).      | The domain you sign in at (`us.` or `eu.`). | Yes      |
| **Personal API key** | A PostHog personal API key used as a bearer token on every request. | Settings → Personal API keys (see above).   | Yes      |

Self-hosted PostHog instances are not supported in this version.

## What gets indexed

| Object type              | Represents                                                             |
| ------------------------ | ---------------------------------------------------------------------- |
| **PostHog Organization** | A PostHog organization (top-level account / billing entity).           |
| **PostHog Project**      | A project within an organization — the container for events and flags. |
| **PostHog Member**       | A person who belongs to an organization, with their role.              |

All organizations your API key can access are imported, and their projects and members are imported per-organization (so multi-organization accounts are fully covered).

Feature flags are **not** indexed as objects (a project can have hundreds); they are available as a data stream scoped to a project instead.

## Known limitations

- **Rate limits.** PostHog enforces per-key rate limits (typically a few hundred requests/minute, and lower limits on the analytics/query endpoints). Very frequent refreshes of many HogQL tiles may be throttled.
- **Query scopes.** The event-volume, active-users, top-events and HogQL streams use the `/query/` endpoint, which requires the `query:read` scope. Without it those streams return an authorization error while imports still succeed.
- **Billing data is unavailable.** PostHog's billing API cannot be accessed with a personal API key, so spend/usage cost data is not surfaced.
- **HogQL result size.** Very large query results are capped (~6MB per request); narrow the timeframe or aggregate in the query if a stream reports a size error.
