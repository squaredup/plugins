Monitor your [Healthchecks.io](https://healthchecks.io) cron jobs, scheduled tasks and heartbeats in SquaredUp: current check status, up/down history and job run times, using the [Healthchecks.io Management API](https://healthchecks.io/docs/api/). Self-hosted [Healthchecks](https://github.com/healthchecks/healthchecks) instances are supported too.

## Setup

You will need a Healthchecks.io **project API key**. API keys belong to a single project, so add one data source per project you want to monitor.

1. Sign in to [Healthchecks.io](https://healthchecks.io/accounts/login/) and open the project to monitor.
2. Go to **Settings** (the project's settings page) and find the **API Access** section.
3. Click **Create API Keys** if the project has no keys yet. Healthchecks.io creates a **read-write** key and a **read-only** key.
4. Copy the **read-only** key and paste it into the **API key** field. The plugin never changes anything in Healthchecks.io, and a read-only key covers everything except the ping log (see [Known limitations](#known-limitations)). Use the read-write key instead if you want job run times and the ping log. You can switch key type later without losing checks or dashboards.
5. Leave **Server URL** as `https://healthchecks.io`, unless you run your own Healthchecks instance.

> ⚠️ The **Ping key** shown on the same settings page is used to *send* pings and does not work with the Management API. Use one of the **API keys**.

## Configuration fields

| Field | What it is | Where to find it | Required |
| ----- | ---------- | ---------------- | -------- |
| **API key** | A project API key, sent in the `X-Api-Key` header. Read-only or read-write. | Healthchecks.io → your project → **Settings → API Access**. | Yes |
| **Server URL** | The address of the Healthchecks instance. Defaults to `https://healthchecks.io`. | Change only for a self-hosted instance, e.g. `https://healthchecks.example.com`. | Yes |
| **Ignore certificate errors** | Skips TLS certificate validation. | Enable only for a self-hosted instance with a self-signed or private CA certificate. | No |

On save, the plugin validates the configuration by listing the project's checks. An invalid key, a ping key in place of an API key, or a wrong server URL fails setup with an authentication error.

## What this plugin monitors

- **Check status**: whether each check is up, late (in its grace period), down, paused or new, when it last pinged and when the next ping is due.
- **Availability**: how long each check spent up and down over a timeframe, and the outages in between.
- **Job runs**: every ping a check received, with success or failure, source IP and, for jobs that send a start signal, how long the job ran.

The out-of-the-box dashboards include a project-wide **Overview**, a **Check** perspective for each check and a **Tag** perspective showing every check with a given tag.

## Data streams

- **Checks**: current status, schedule and last ping of every check in the project. **Filter by check** narrows it to selected checks; **Filter by tag** narrows it to checks that have every selected tag.
- **Status History**: up and down periods of a check over the selected timeframe, one row per period. Per check.
- **Pings**: pings received by a check over the selected timeframe, including job run time and exit status where reported. Per check, and needs a read-write API key.

## What gets indexed

| Object type | API source | Represents |
| ----------- | ---------- | ---------- |
| **Check** | `GET /api/v3/checks/` | A Healthchecks.io check: a cron job, scheduled task or heartbeat being monitored. |
| **Tag** | `GET /api/v3/badges/` | A tag used by one or more checks in the project. |

Each check is indexed with its slug, kind (simple, cron or OnCalendar), period or schedule, time zone, grace time, description, tags and a link to the check in Healthchecks.io. Tags are indexed individually, so you can build scopes such as "all checks tagged `prod`". Objects are refreshed every 12 hours. The **Checks** stream always shows live status.

**Relationships:** each Check **has tag** each Tag it carries (Tag **tag of** Check). Relationships are made within a data source, so a tag used in two projects appears as one Tag per project, each linked to its own project's checks.

## Known limitations

- **The ping log needs a read-write key.** Healthchecks.io read-only keys can't read pings, so **Pings** tiles show an error with a read-only key. Everything else works with either key type.
- **The ping log is capped.** Healthchecks.io returns only the newest 100 pings (free accounts) or 1,000 pings (paid accounts) per check. For frequently pinged checks, longer timeframes show only the most recent pings.
- **Job run time needs start signals.** Duration is only recorded when a job sends a `/start` ping before its success or failure ping.
- **Status history covers about three months.** Healthchecks.io keeps status changes for the current month and the two months before it, so **Status History** offers timeframes up to **This quarter**. Time before a check's earliest retained status change isn't shown.
- **Paused periods appear as down.** Healthchecks.io records status changes only as up or not up, so a period when a check was paused shows as down in **Status History**.
- **Rate limit.** Healthchecks.io allows 100 API requests per minute per project. **Status History** and **Pings** make one request per check, so keep those tiles scoped to a handful of checks rather than a whole large project.
- **One project per data source.** API keys belong to a single project. Add a data source for each project.
- **Read-only.** The plugin never creates, changes, pauses or deletes anything in Healthchecks.io.
