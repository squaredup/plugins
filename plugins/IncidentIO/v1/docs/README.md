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

- **Incidents** — status, severity, type, timeline of updates, attached alerts, and escalations for each incident.
- **Alerts** — alerts ingested by your alert sources, and which incidents they're attached to.
- **On-call schedules** — who's on call right now, upcoming/recent shifts, and which schedules a given user belongs to.
- **Teams and users** — team membership counts, and each user's role and on-call/response seat access.

The out-of-the-box dashboards include an estate-wide **Overview** plus a perspective for each of **Incident**, **Alert**, **Schedule**, **Team**, and **User**.

## Data streams

- **Current User** — identity and role for the configured API key (used to validate setup; hidden from the tile editor).
- **Incident Properties** — current status, severity, type and timestamps for one incident.
- **Incident Updates** — the history of status and severity changes for one incident.
- **Incident Alerts** — the alerts attached to one incident.
- **Incident Escalations** — the escalation timeline (who was paged, when acked/resolved) for one incident, over a timeframe.
- **Alert Properties** — current status, description and timestamps for one alert.
- **Schedule On-Call** — the current on-call shift(s) for one schedule.
- **Schedule Shifts** — the effective shift schedule for one schedule, over a timeframe.
- **User Schedules** — the on-call schedules a given user currently appears in.

## What gets indexed

| Object type | API source | Represents |
| ----------- | ---------- | ---------- |
| **Incident** | `GET /v2/incidents` | An incident declared in incident.io. |
| **Alert** | `GET /v2/alerts` | An alert ingested from a third-party alert source. |
| **Schedule** | `GET /v2/schedules` | An on-call rotation schedule. |
| **Team** | `GET /v3/teams` | A team, with its member count. |
| **User** | `GET /v2/users` | A person in your incident.io organization. |

**Relationships:** Incidents, Alerts and Schedules are cross-referenced from their respective perspective dashboards (attached alerts and escalations for an incident, on-call shifts for a schedule and a user), but are not modelled as direct graph links.

## Known limitations

- **Some list endpoints cap page size lower than others** — the alerts, incident-alerts and escalations endpoints accept at most 50 records per page (vs 100–250+ elsewhere); large volumes of alert/escalation history are paged automatically but may take longer to import or query.
- **Alert and escalation data depends on your incident.io setup** — if no alert sources or on-call escalation paths are configured, the Alert object type, and the Incident Alerts / Incident Escalations / Alert Properties streams, will simply be empty rather than erroring.
- **Schedule shifts show recent history, not future shifts** — the Schedule perspective's shift tile uses the standard dashboard timeframe (which only looks backward), so upcoming on-call shifts aren't shown; check the incident.io on-call UI for future rotations.
- **Teams requires the `catalog_entries.view` scope** on your API key — without it, team import and the Team object type will be unavailable.
- **User Schedules checks only the first page of schedules** — for organizations with more than ~100 schedules, a user's on-call status on schedules beyond the first page won't be reflected.
- **Rate limits** — the incident.io API allows up to 1,200 requests/minute per key, with a lower 60/minute limit specifically on listing incidents; very large estates may import more slowly as a result.
- **Read-only** — the plugin never creates, modifies, or deletes anything in incident.io.
