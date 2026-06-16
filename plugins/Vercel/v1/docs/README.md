# Vercel

Monitor your [Vercel](https://vercel.com) projects, deployments, and domains in SquaredUp. This plugin connects to the Vercel REST API to import your projects and domains as objects you can scope dashboards to, and provides data streams for deployment health and history, domain verification and expiry, team membership and activity, and a billing-based cost overview.

## What this plugin monitors

- **Projects** — your Vercel projects, including framework, git repository, and latest production deployment status. Imported as objects.
- **Domains** — custom domains, including verification status, expiry/renewal dates, and configuration health. Imported as objects.
- **Deployments** — deployment volume, success/failure rates, and history over time, account-wide or drilled down per project. (Deployments are *not* indexed as objects, because they change too frequently — they are available as data streams instead.)
- **Team & activity** — team membership roster and recent account activity (events).
- **Cost** — a cost/usage overview derived from Vercel billing data (daily granularity).
- **Firewall / security** — per-project [Vercel Firewall (WAF)](https://vercel.com/docs/vercel-firewall) posture: whether the firewall is enabled, which managed protections (OWASP-style CRS categories, bot protection, AI bots) are active and their action, plus active attack anomalies over time. Available as data streams on the **Project** perspective.

The plugin ships with three out-of-the-box dashboards: an account **Overview**, a **Project** perspective (which includes a **Security** section), and a **Domain** perspective.

## Prerequisites — getting a Vercel Access Token

1. Sign in to Vercel and open **Account Settings → Tokens** (<https://vercel.com/account/tokens>).
2. Click **Create Token**.
3. Give it a name (e.g. `SquaredUp`).
4. **Scope** — choose the scope the token can access:
   - To monitor a **Team**, set the scope to that team and note the team's ID or slug (see the `Team ID` field below).
   - To monitor your **personal account**, scope it to your personal account.
5. **Expiration** — choose an expiration (or no expiration). If the token expires, the plugin's data streams will stop returning data until you supply a new token.
6. Click **Create** and copy the token value immediately — Vercel only shows it once.

For the **cost overview** and **team members** streams, the token must belong to a Team and carry a role with billing/member visibility (Owner, Member, Developer, Security, or Billing). On personal/Hobby accounts these streams may return no data.

### Finding your Team ID

If you are monitoring a Team, open **Team Settings → General** in Vercel; the **Team ID** (format `team_xxxxxxxx`) is shown there. Enter that value in the `Team ID` field. (Leave the field blank to monitor your personal account instead.)

## Configuration fields

| Field | Required | Description | Where to find it |
| --- | --- | --- | --- |
| **API Token** | Yes | The Vercel Access Token used to authenticate. Sent as a bearer token on every request. | Account Settings → Tokens (see above). |
| **Team ID** | No | The Team ID or slug to monitor. Leave blank to monitor your personal account. When set, all requests are scoped to this team. | Team Settings → General (`team_…`), or the slug in your Vercel URL. |

## What gets indexed

The plugin imports two object types into the SquaredUp graph:

- **Vercel Project** — one object per project in the configured account/team. Carries the project name, framework, git repository link, and identifiers.
- **Vercel Domain** — one object per custom domain. Carries the domain name, verification status, and expiry information.

Deployments, teams, members, activity events, and cost data are provided as **data streams** (not indexed objects) — query them on dashboards and scope deployment streams to a project.

## Known limitations

- **Deployments are not indexed.** They are available only as data streams, because deployment volume and churn make them unsuitable as long-lived graph objects.
- **No real-time analytics or metrics via REST.** Vercel does **not** expose Web Analytics (pageviews/visitors), Speed Insights (Core Web Vitals), or real-time Observability metrics (edge requests, function invocations, bandwidth) through its public REST API. Operational usage is available only as **daily billed quantities** via the cost stream — not real-time, per-request telemetry.
- **Cost data is daily granularity** and the billing endpoint returns very large datasets, so the cost stream is restricted to the **Last 24 hours** and **Last 7 days** timeframes.
- **Team members and cost require a Team** and a token with adequate role/plan. On personal/Hobby accounts these streams may be empty.
- **Firewall streams only return data for projects with a configured firewall.** The Vercel Firewall config endpoint returns a 404 (not an empty result) for any project that has never configured a firewall, so the firewall posture and managed-rules tiles render only for projects where the WAF has been set up; for other projects the tile shows no data. The attack-anomalies stream returns an empty result (not an error) when there is no active attack.
- **One connection = one scope.** Each configured plugin instance monitors either your personal account or a single team. To monitor multiple teams, add the plugin once per team.
- **Rate limits.** Vercel enforces per-action rate limits (HTTP 429). Very large accounts may occasionally see throttling during imports.
