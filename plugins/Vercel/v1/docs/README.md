# Vercel plugin

Monitor your [Vercel](https://vercel.com) projects, deployments, and domains in SquaredUp. This plugin connects to the Vercel REST API to import your projects and domains as objects you can scope dashboards to, and provides data streams for deployment health and history, domain verification and expiry, team membership and activity.

## Before you start

1. Sign in to Vercel and open **Account Settings → Tokens** (<https://vercel.com/account/tokens>).
2. Click **Create Token**.
3. Give it a name (e.g. `SquaredUp`).
4. **Scope** — choose the scope the token can access:
    - To monitor a **Team**, set the scope to that team.
    - To monitor your **personal account**, scope it to your personal account.
5. **Expiration** — choose an expiration (or no expiration). If the token expires, the plugin's data streams will stop returning data until you supply a new token.
6. Click **Create** and copy the token value then paste it into the **API token** field.

For the **team members** streams, the token must belong to a Team and carry a role with billing/member visibility (Owner, Member, Developer, Security, or Billing). On personal/Hobby accounts these streams may return no data.

Paste this token in the **API token** field.

## Configuration fields

| Field         | Required | Description                                                                            | Where to find it                       |
| ------------- | -------- | -------------------------------------------------------------------------------------- | -------------------------------------- |
| **API token** | Yes      | The Vercel Access Token used to authenticate. Sent as a bearer token on every request. | Account Settings → Tokens (see above). |

## What is monitored

- **Projects** — your Vercel projects, including framework, git repository, and latest production deployment status. Imported as objects.
- **Domains** — custom domains, including verification status, expiry/renewal dates, and configuration health. Imported as objects.
- **Deployments** — deployment volume, success/failure rates, and history over time, account-wide or drilled down per project. (Deployments are _not_ indexed as objects, because they change too frequently — they are available as data streams instead.)
- **Team & activity** — team membership roster and recent account activity (events).
- **Firewall / security** — per-project [Vercel Firewall (WAF)](https://vercel.com/docs/vercel-firewall) event activity: counts of firewall events broken down by action (e.g. allow / deny / challenge) over time. Available as data streams on the **Project** perspective's **Security** section.

## What gets indexed

The plugin imports three object types into the SquaredUp graph:

- **Vercel Project** — one object per project in the configured account/team. Carries the project name, framework, git repository link, and identifiers.
- **Vercel Domain** — one object per custom domain. Carries the domain name, verification status, and expiry information.
- **Vercel Team** - one object per team in the configured account, that the token has access to.

Deployments, members, and activity events are provided as **data streams** (not indexed objects) — query them on dashboards and scope deployment streams to a project.

## Known limitations

- **Deployments are not indexed.** They are available only as data streams, because deployment volume and churn make them unsuitable as long-lived graph objects.
- **No real-time analytics or metrics via REST.** Vercel does **not** expose Web Analytics (pageviews/visitors), Speed Insights (Core Web Vitals), or real-time Observability metrics (edge requests, function invocations, bandwidth) through its public REST API.
- **Team members require a Team** and a token with adequate role/plan. On personal/Hobby accounts these streams may be empty.
- **Firewall events only appear for projects with the WAF configured.** The Firewall events stream returns rows only for projects that have the Vercel Firewall set up and that recorded events within the selected timeframe; a project with no firewall activity in that window shows an empty result (not an error).
- **One connection = one scope.** Each configured plugin instance monitors either your personal account or a single team. To monitor multiple teams, add the plugin once per team.
- **Rate limits.** Vercel enforces per-action rate limits (HTTP 429). Very large accounts may occasionally see throttling during imports.
