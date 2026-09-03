Monitor your [incident.io](https://incident.io) incidents, alerts, on-call schedules, teams and users in SquaredUp, via the [incident.io API](https://docs.incident.io/api-reference/introduction).

## Setup

You will need an incident.io **API key**.

1. Sign in to your [incident.io dashboard](https://app.incident.io).
2. Go to **Settings → API keys** and click **Create API key**. Give it at least the **View data** permission — the plugin never creates, updates, or deletes anything in incident.io.
3. Copy the generated key and paste it into the **API key** field below.

## Configuration fields

| Field | What it is | Where to find it | Required |
| ----- | ---------- | ----------------- | -------- |
| **API key** | Authenticates every request via the `Authorization: Bearer` header. | incident.io dashboard → **Settings → API keys**. | Yes |

On save, the plugin validates the key by calling the identity endpoint; an invalid or expired key fails setup with an authentication error.

## What this plugin monitors

- **Incidents** — live status, severity and type breakdowns, open/total counts, and a recent-incidents table.
- **Alerts** — live status and a recent-alerts table, including how many are currently firing.
- **On-call schedules** — who's on call right now, recent shifts, and which schedules a given user belongs to.
- **Teams and users** — team membership counts, and each user's role and on-call/response seat access.

The out-of-the-box dashboards include an estate-wide **Overview** plus a perspective for each of **Schedule**, **Team**, and **User**.

## Data streams

- **Current User** — identity and role for the configured API key (used to validate setup; hidden from the tile editor).
- **Incidents** — all incidents in the organization, one row per incident.
- **Alerts** — all alerts ingested by your alert sources, one row per alert.
- **Schedule On-Call** — the current on-call shift(s) for one schedule.
- **Schedule Shifts** — the effective shift schedule for one schedule, over a timeframe.
- **User Schedules** — the on-call schedules a given user currently appears in.

## What gets indexed

| Object type | API source | Represents |
| ----------- | ---------- | ---------- |
| **Schedule** | `GET /v2/schedules` | An on-call rotation schedule. |
| **Team** | `GET /v3/teams` | A team, with its member count. |
| **User** | `GET /v2/users` | A person in your incident.io organization. |

**Incidents and Alerts are not indexed as objects.** They're created and resolved far faster than the platform's default ~12-hour reindex interval — indexing them would mean a new incident could be invisible for hours. Instead, they're served live via the **Incidents** and **Alerts** data streams (always fresh, no reindex lag) and shown as filterable/groupable tiles on the Overview dashboard, rather than as individual drilldown pages.

## Known limitations

- **Alerts cap page size at 50 records** (vs 100+ for schedules/teams/users); large alert volumes are paged automatically but may take longer to query.
- **Alert data depends on your incident.io setup** — if no alert sources are configured, the Alerts stream and its Overview tiles will simply be empty rather than erroring.
- **No per-incident or per-alert drilldown dashboard** — since neither is indexed as an object (see above), there's no dedicated page for a single incident's update timeline, attached alerts, or escalations; use the incident.io web app for that level of detail.
- **Schedule shifts show recent history, not future shifts** — the Schedule perspective's shift tile uses the standard dashboard timeframe (which only looks backward), so upcoming on-call shifts aren't shown; check the incident.io on-call UI for future rotations.
- **Teams requires the `catalog_entries.view` scope** on your API key — without it, team import and the Team object type will be unavailable.
- **User Schedules checks only the first page of schedules** — for organizations with more than ~100 schedules, a user's on-call status on schedules beyond the first page won't be reflected.
- **Rate limits** — the incident.io API allows up to 1,200 requests/minute per key, with a lower 60/minute limit specifically on listing incidents; very large estates may query more slowly as a result.
- **Read-only** — the plugin never creates, modifies, or deletes anything in incident.io.
