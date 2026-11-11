Monitor your [incident.io](https://incident.io) incidents, alerts, escalations, follow-ups, on-call schedules, status pages, teams and users in SquaredUp, via the [incident.io API](https://docs.incident.io/api-reference/introduction).

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

- **Incidents** — active and historical incidents with severity, status, lead, owning team, workload and duration metrics (e.g. MTTR).
- **Alerts** — alert volume, firing vs resolved, and how long alerts stay open, overall or per alert source.
- **Escalations** — escalation outcomes and time to acknowledge, plus who is currently responding on each escalation path.
- **Follow-ups** — outstanding and completed post-incident follow-ups by status, priority, assignee and team.
- **On-call schedules** — who's on call now, upcoming shifts (up to 30 days ahead) and shift history.
- **Status pages** — public status page incidents and per-component availability.
- **Workflows** — workflow runs and failures.
- **Teams and users** — team membership, and each user's role and on-call/response seat access.

The out-of-the-box dashboards include an estate-wide **Overview**, an **Alerting and Escalations** dashboard and a **Post-Incident** dashboard, plus a perspective for each of **Schedule**, **Team**, **User**, **Alert Source**, **Status Page** and **Status Page Component**.

## Data streams

- **Incidents** — incidents created within the timeframe (or all, with timeframe *None*), one row per incident. Optional filters: status category, team, and include test/tutorial incidents.
- **Incident Duration Metrics** — one row per incident per duration metric (the metrics configured in your incident.io organization, such as time to resolve), in minutes and hours. Same optional filters as Incidents.
- **Alerts** — alerts created within the timeframe (or all, with timeframe *None*), one row per alert. Optional filters: status and alert source.
- **Escalations** — escalations created within the timeframe, with status, priority and time to acknowledge. Optional status filter.
- **Escalation Paths** — every escalation path with its level count and current responders. Optional team filter.
- **Follow-Ups** — follow-ups created within the timeframe, with status, priority, assignee and age. Optional filters: assignee team, assignee, and test incidents only.
- **Workflow Runs** — workflow runs created within the timeframe, with the run outcome and failed step count.
- **Schedule On-Call** — the current on-call shift(s) for one schedule.
- **Schedule Shifts** — one schedule's shifts across the dashboard timeframe or the next 24 hours to 30 days, for final, scheduled or override entries.
- **User Schedules** — the on-call schedules a given user currently appears in.
- **Status Page Incidents** — incidents published to one status page that had impact within the timeframe.
- **Component Availability** — availability percentage of a status page component over the timeframe.
- **Current User** — identity for the configured API key (used to validate setup; hidden from the tile editor).

## What gets indexed

| Object type | API source | Represents |
| ----------- | ---------- | ---------- |
| **Schedule** | `GET /v2/schedules` | An on-call rotation schedule. |
| **Team** | `GET /v3/teams` | A team, with its member count. |
| **User** | `GET /v2/users` | A person in your incident.io organization. |
| **Alert Source** | `GET /v2/alert_sources` | A source that sends alerts to incident.io (e.g. Datadog, Grafana, HTTP). Its secret token and ingest URL are never imported. |
| **Status Page** | `GET /v2/status_pages` | A public or internal status page. |
| **Status Page Component** | `GET /v2/status_page_structures/{id}` | A component shown on a status page, with its group and sub-page. |

**Incidents, alerts, escalations and follow-ups are not indexed as objects.** They change far faster than the platform's default ~12-hour reindex interval, so they're served live via data streams (always fresh, no reindex lag) and shown as filterable/groupable tiles, rather than as individual drilldown pages.

## Sending SquaredUp alerts to incident.io

This plugin reads data from incident.io. To send SquaredUp monitor alerts **to** incident.io, use the **incident.io** notification destination. It doesn't need this plugin or its API key.

1. In incident.io, go to **On-call → Alert routing → Sources**, select **Create source**, choose **HTTP**, and keep the **Default** type.
2. On the **Connect** step, copy the **URL** and **Headers** values from the **Header authentication** tab.
3. In SquaredUp, go to **Settings → Notifications**, select **Add destination**, choose **incident.io**, and paste them in.
4. Add the destination to a monitor's notification rule.

A warning or error fires an alert in incident.io, and the alert resolves when the monitor recovers. See [Set up an incident.io notification destination](https://squaredup.com/cloud/channelsetup-incidentio) for the details.

## Known limitations

- **Duration metrics depend on your incident.io configuration** — metric names (e.g. "Time to resolve") are defined per organization, and a metric only has a value once the timestamps it needs are set. The Incidents stream's **Time to Resolve** column is filled only when a metric with "resolve" in its name exists; use **Incident Duration Metrics** for any other metric.
- **Test and tutorial incidents are excluded by default** — incident.io only returns standard and retrospective incidents unless asked. Turn on **Include test and tutorial incidents** to include them. For follow-ups the API can only return test-incident follow-ups *instead of* normal ones, so that option is labelled **Test incidents only**.
- **Team filtering on incidents happens after the request** — incident.io has no team filter for incidents, so all incidents in the timeframe are fetched and then filtered. Prefer a bounded timeframe in very large organizations.
- **Escalations don't name their escalation path** — the API returns only the path ID; use the **Escalation Paths** stream for path names and current responders.
- **Status page incidents list affected components by ID** — the API doesn't return component names on status page incidents.
- **Component availability is limited to 366 days** per query, and the timeframe *None* isn't offered.
- **Alerts cap page size at 50 records** (escalations and workflow runs too); large volumes are paged automatically but may take longer to query.
- **Empty streams are normal for unused features** — if you have no alert sources, status pages, escalations or workflows, the related streams and tiles are empty rather than erroring.
- **Teams requires the `catalog_entries.view` scope** on your API key — without it, team import and the Team object type will be unavailable.
- **Rate limits** — the incident.io API allows up to 1,200 requests/minute per key, with a lower 60/minute limit specifically on listing incidents; very large estates may query more slowly as a result.
- **No per-incident drilldown page** — incidents aren't indexed as objects, so there's no dedicated page for a single incident's timeline or attachments; use the **Permalink** column to open it in incident.io.
- **Read-only** — the plugin never creates, modifies, or deletes anything in incident.io.
