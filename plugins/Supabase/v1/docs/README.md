Monitor your [Supabase](https://supabase.com) projects and Edge Functions in SquaredUp, including project and service health, security and performance advisors, API and function traffic, backups and database resource usage. The plugin uses the [Supabase Management API](https://supabase.com/docs/reference/api/introduction).

## Setup

You need a Supabase **personal access token**. One token covers every organization and project it can reach.

1. Sign in to the [Supabase dashboard](https://supabase.com/dashboard).
2. Open **Account preferences → [Access Tokens](https://supabase.com/dashboard/account/tokens)** and generate a new token.
3. Scope the token to the organizations and projects to monitor, and grant **Read** access to these permissions:
    - **Projects (account-wide)**: lists your projects
    - **Project Settings**: service health
    - **Advisors**: security and performance advisor findings
    - **Usage Analytics**: API request counts and Edge Function stats
    - **Logs**: API responses and database metrics
    - **Backups**: backup history
    - **Disk Config**: disk usage
    - **Edge Functions**: lists your Edge Functions
4. Set an expiry that suits you. When the token expires the plugin stops collecting data until you paste in a new one.
5. Copy the token, which starts with `sbp_`, and paste it into the **Personal access token** field.

Without **Projects (account-wide)** the token fails the **Authenticate** step on save. A token missing any of the other permissions still connects, but the streams that need it fail with a permission error. See [Personal access tokens](https://supabase.com/docs/guides/platform/personal-access-tokens) in the Supabase docs for more on scoping.

## Configuration fields

| Field | What it is | Where to find it | Required |
| --- | --- | --- | --- |
| **Personal access token** | Authenticates every request to the Supabase Management API as a bearer token. | Supabase dashboard → **Account preferences → Access Tokens**. | Yes |

On save, the plugin lists the projects the token can see. An invalid or expired token fails the **Authenticate** step. A token that can't see any projects fails **Check project access**.

## What this plugin monitors

- **Project and service health**: each project's status, and the health of its Auth, Database, Connection pooler, Realtime, Data API and Storage services.
- **Security and performance**: the findings Supabase Advisors report for each project, with severity and a link to the fix.
- **API traffic**: request volume per service, and responses by HTTP status class so you can track error rates.
- **Edge Functions**: deployed functions with their status and version, plus invocations, errors and execution time per function.
- **Database resources**: disk usage, memory, load and connections against the connection limit.
- **Backups**: backup history and status, and whether point-in-time recovery is on.

The out-of-the-box dashboards include an **Overview** of all projects plus a perspective for each **Project** and **Edge Function**.

## Data streams

- **Projects**: every project the token can see, with status, organization, region and Postgres version. Account-wide.
- **Service health**: current health of each Supabase service. Per project.
- **Advisor findings**: security and performance advisor findings with severity, affected entity and remediation link. Per project.
- **API requests**: request counts over time by service (Data API, Auth, Storage, Realtime). Per project.
- **API responses**: API gateway requests over time by service and HTTP status class (2xx, 4xx, 5xx). Per project.
- **Edge Functions**: the functions deployed to a project, with status, version and last deployment. Per project.
- **Edge Function stats**: invocations, responses by status class, and average and maximum execution time over time. Per Edge Function.
- **Database backups**: backup history, backup type and point-in-time recovery status. Per project.
- **Disk usage**: current disk size, used and free space, and percentage used. Per project.
- **Database metrics**: current memory use, load averages, CPU cores, and active connections against the limit. Per project.

## What gets indexed

| Object type | API source | Represents |
| --- | --- | --- |
| **Project** | `GET /v1/projects` | A Supabase project, with its status, organization, region and Postgres version. |
| **Edge Function** | `GET /v1/projects/{ref}/functions` | An Edge Function deployed to a project. |

**Relationships:** each Edge Function stores the reference ID and name of the project it belongs to.

## Known limitations

- **Fixed time ranges on traffic streams.** The Supabase API only offers set windows, so each traffic stream supports a fixed list of timeframes:
    - **API requests**: last hour, last 24 hours and last 7 days.
    - **API responses**: up to the last 24 hours, because log queries are capped at 24 hours.
    - **Edge Function stats**: last hour and last 24 hours.
- **Gaps instead of zeros.** Traffic streams skip time buckets with no requests, so quiet periods show as gaps in charts.
- **API responses reads gateway log messages.** Path and status come from the text of each API gateway log line. Requests that bypass the gateway, such as direct Postgres or pooler connections, aren't counted.
- **No CPU percentage.** The metrics Supabase exposes include CPU time only as a running total, so **Database metrics** reports load averages and core count instead.
- **Realtime health on idle projects.** Realtime can report **Unhealthy** on the first health check after a project has been idle, then recover on the next check.
- **Rate limits.** The Management API allows 120 requests a minute per user for each project, and 30 a minute for log queries. Dashboards that show many projects at once can be throttled briefly and show errors until the limit resets. **Advisor findings** makes two requests per project.
- **Backups on projects without any.** A project that lists no backups shows a single **None** row, so unprotected projects stay visible.
