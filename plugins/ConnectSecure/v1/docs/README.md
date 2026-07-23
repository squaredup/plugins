# Before you start

[ConnectSecure](https://connectsecure.com) (formerly CyberCNS) is a vulnerability management and security assessment platform used by MSPs to scan and report on managed companies' assets, vulnerabilities, and compliance posture. This plugin imports your managed companies, agents, and assets into SquaredUp, and gives you a single cross-company view of vulnerability, compliance, and remediation status instead of switching company context in ConnectSecure's own UI.

## Prerequisites

You'll need a set of **API client credentials** from ConnectSecure, plus your **pod URL** and **tenant name**. ConnectSecure issues API credentials per integration — contact your ConnectSecure account administrator or ConnectSecure support if you don't already have API access enabled.

1. Log in to your ConnectSecure tenant and find your **pod URL** — this is the base URL you use to access ConnectSecure day-to-day, e.g. `https://pod401.myconnectsecure.com`. Every tenant is hosted on a specific pod, so this is not the same for every customer.
2. Note your **tenant name** exactly as ConnectSecure has it configured — this is combined with your client ID during authentication.
3. Request (or locate) an API **Client ID** and **Client Secret** for your tenant. These are separate from your normal ConnectSecure login and are typically issued by ConnectSecure support for programmatic/API access.

## Configure the plugin in SquaredUp

| Field | What it is | Required |
| --- | --- | --- |
| **Pod Base URL** | The base URL of your ConnectSecure pod, e.g. `https://pod401.myconnectsecure.com` — no trailing slash or path. | Yes |
| **Tenant Name** | Your ConnectSecure tenant name, exactly as configured on your account. | Yes |
| **Client ID** | The API client ID issued by ConnectSecure. | Yes |
| **Client Secret** | The API client secret issued by ConnectSecure. Treated as a secret and masked in the UI. | Yes |

The plugin exchanges these for an access token automatically (and refreshes it as needed) — you never need to obtain or paste a token yourself.

## What gets indexed

- **Company** — each managed company/customer in your ConnectSecure tenant (name, domain, location, tags)
- **Agent** — every ConnectSecure agent installed across your managed companies (hostname, IP, OS, agent version, last check-in time), linked to its Company
- **Asset** — every scanned device across your managed companies (IP, platform, OS, hardware, importance), linked to its Company

## Dashboards

- **MSP Overview** — one table across every managed company: total assets, critical/high vulnerability counts, and compliance status, plus a rollup of how many companies currently have critical vulnerabilities outstanding
- **Company Detail** — scoped to a single company: stale/offline agents, asset inventory by OS/platform, and vulnerability breakdown by severity
- **Vulnerability Management** — cross-company severity breakdown and the companies with the most critical vulnerabilities
- **Compliance Status** — compliance assessment status per company, and companies with no recent assessment
- **Remediation Tracking** — remediation plans for a single company (affected assets and severity breakdown by solution) — intentionally company-scoped only, see limitations below

## Known limitations

- **Rate limits.** ConnectSecure enforces hard platform-wide limits of 300 requests/minute, 2,000/hour, and 30,000/day — these apply across your whole tenant, not per plugin. This plugin requests large pages (up to 5,000 records) to minimize call volume, but MSPs with a very large number of managed companies should be mindful of how often dashboards using the **Remediation Tracking** stream are refreshed, since that endpoint requires one API call per company.
- **Remediation plans are company-scoped only.** The ConnectSecure API requires a `company_id` for this endpoint — there is no efficient way to pull remediation data for every managed company in one call, so this stream is only usable when scoped to a single company (e.g. via the Company Detail or Remediation Tracking dashboard), never as an account-wide tile.
- **No historical trending.** Several streams (company stats, vulnerability summary, compliance assessments) reflect current state rather than a queryable time range — the underlying ConnectSecure API does not expose a historical time-series for this data.
- **Credentials are tenant-wide.** The client ID/secret pair grants access to every company visible to that API user in ConnectSecure — there's no way to restrict a single plugin configuration to a subset of managed companies.
