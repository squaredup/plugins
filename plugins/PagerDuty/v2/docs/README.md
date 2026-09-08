Monitor [PagerDuty](https://www.pagerduty.com) incidents, services, on-call
schedules and responder performance in SquaredUp, via the
[PagerDuty REST API](https://developer.pagerduty.com/api-reference).

## Setup

You will need a PagerDuty **REST API key**.

1. Sign in to your [PagerDuty account](https://app.pagerduty.com).
2. For a key tied to your own user, go to **My Profile → User Settings** and
   click **Create API User Token**. For a key that keeps working if your
   account is ever removed, go to **Integrations → API Access Keys** instead
   and click **Create New API Key** (requires admin permissions) — choose
   **Read-only** unless you have a reason to grant write access.
3. Copy the generated key and paste it into the **API token** field.
4. Choose the **Service region** that matches your account (check
   **Account Settings** in PagerDuty if you're unsure — most accounts are
   **Global/US**).

## Configuration fields

| Field | What it is | Where to find it | Required |
| ----- | ---------- | ----------------- | -------- |
| **API token** | Authenticates every request via the `Authorization: Token token=...` header. | PagerDuty → **My Profile → User Settings** (personal) or **Integrations → API Access Keys** (general access). | Yes |
| **Service region** | Selects the PagerDuty API host (`api.pagerduty.com` or `api.eu.pagerduty.com`) for your account. | PagerDuty → **Account Settings**. | Yes |
| **Timezone** | IANA timezone used to align time-based filters and aggregated results. | — | No |

On save, the plugin validates the token by fetching your account's enabled
abilities; an invalid, expired, or revoked token fails setup with an
authentication error.

## What this plugin monitors

- **Incidents** — filterable by status, urgency, service, team and assignee, plus account-wide and per-service/team/escalation-policy aggregated analytics (MTTA, MTTR, escalation and interruption counts).
- **Services** — current status, escalation policy and team associations.
- **On-call** — who's on call now and over an upcoming look-ahead window, per user, schedule or escalation policy.
- **Users and responder performance** — roster, incident load, mean time to acknowledge, interruptions and time spent on-call.
- **Notifications** — outbound notifications sent to responders (SMS, email, phone, push).

The out-of-the-box dashboards include an account-wide **Overview**, a dedicated **On-Call** dashboard, and a perspective for each **Service**, **User** and **Team**.

## Data streams

- **Services** — current status, escalation policy and team associations, one row per service.
- **Users** — role, contact and team associations, one row per user.
- **Incidents** — filterable by status, urgency, service, team and assignee, one row per incident, including who last modified/resolved it.
- **Incident Metrics** — account-wide aggregated incident analytics, optionally bucketed by day, week or month.
- **Incident Metrics by Service/Team/Escalation Policy** — the same analytics grouped by dimension, one row per group.
- **Responder Metrics** — aggregated responder performance, one row per responder.
- **On-Call** — who is on call now and over an upcoming look-ahead window, one row per shift.
- **Notifications** — outbound notifications sent to responders, one row per notification.

## What gets indexed

| Object type | API source | Represents |
| ----------- | ---------- | ---------- |
| **Service** | `GET /services` | A monitored PagerDuty service. |
| **User** | `GET /users` | A PagerDuty user who can respond to incidents. |
| **Team** | `GET /teams` | A group of users and services. |
| **Schedule** | `GET /schedules` | An on-call rotation schedule. |
| **Escalation Policy** | `GET /escalation_policies` | A set of escalation rules used by one or more services. |

Team membership is stored as a property on each Service and User (`teamIds`/`teamNames`), not as a graph relationship — there is no direct drilldown from a Team to its member services or users.

## Known limitations

- **Incident search is capped at a 6-month window** — this is a hard limit of PagerDuty's own incident search API, not a SquaredUp restriction: a request spanning more than ~6 months is rejected outright. The **Incidents** stream offers every timeframe, including This Year, Last Year and a custom range, but automatically clamps the start of any wider selection to 6 months before the end so the query never fails — you'll silently get the most recent 6 months of a longer range. Use **Incident Metrics** for longer-range trend analysis, which has no such cap.
- **Responder-level resolution counts aren't available** — PagerDuty's responder analytics API reports involvement (incident count, interruptions, acknowledgements, on-call time, mean time to resolve) but not how many incidents each responder actually resolved. For per-incident resolution attribution, use the **Incidents** stream's **Modified By** column, filtered to Status = Resolved.
- **Notifications are capped at a 3-month window** — the **Notifications** stream's timeframe options stop at "Last month".
- **Teams require an add-on account ability** — the **Teams** import step (and the Team scope/dashboards it feeds) only returns data on PagerDuty plans with the Teams ability enabled. On accounts without it, PagerDuty rejects the request and the step is skipped with a warning rather than failing the whole import — everything else (Services, Users, Schedules, Escalation Policies, Incidents, etc.) still imports and refreshes normally.
- **Notifications' User filter is applied client-side** — PagerDuty's notifications endpoint has no server-side user filter, so the plugin fetches the full window and filters by user in the plugin itself. This is transparent to you, but very high notification volumes over a wide timeframe may be slower to filter than a server-side filter would be.
- **No direct Team → Service/User relationship** — the PagerDuty API only lists services/users *with* their team IDs, not teams *with* their members, so the Team perspective shows incidents and responder metrics for a team but not a services/users roster.
- **Rate limits** — PagerDuty enforces per-account API rate limits; very large estates may import or refresh more slowly.
- **Read-only** — the plugin never creates, modifies, or deletes anything in PagerDuty.
