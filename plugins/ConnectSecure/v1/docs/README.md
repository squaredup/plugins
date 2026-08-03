# Before you start

[ConnectSecure](https://connectsecure.com) (formerly CyberCNS) is a vulnerability management and security assessment platform used by MSPs to scan and report on managed companies' assets, vulnerabilities, and compliance posture. This plugin imports your managed companies, agents, and assets into SquaredUp, and gives you a single cross-company view of vulnerability, compliance, and remediation status instead of switching company context in ConnectSecure's own UI.

## Prerequisites

You'll need a set of **API client credentials** from ConnectSecure, plus your **pod URL** and **tenant name**. ConnectSecure issues API credentials per integration — contact your ConnectSecure account administrator or ConnectSecure support if you don't already have API access enabled.

1. Log in to your ConnectSecure tenant and find your **pod URL** — this is the base URL you use to access ConnectSecure day-to-day, e.g. `https://pod401.myconnectsecure.com`. Every tenant is hosted on a specific pod, so this is not the same for every customer.
2. Note your **tenant name** exactly as ConnectSecure has it configured — this is combined with your client ID during authentication.
3. Request (or locate) an API **Client ID** and **Client Secret** for your tenant (**Settings > Users > ⋮ next to a user > API Key**). These are separate from your normal ConnectSecure login and are typically issued by ConnectSecure support for programmatic/API access.
4. Retrieve your **API User ID** — a one-time lookup tied to your Client ID/Secret pair. Run:

   ```bash
   curl -X POST 'https://<pod-base-url>/w/authorize' \
     -H "Client-Auth-Token: $(printf '%s' '<tenant-name>+<client-id>:<client-secret>' | base64)"
   ```

   Substitute your own pod base URL, tenant name, client ID, and client secret. The response JSON includes a `user_id` field — that's the value for the **API User ID** field below. This value is stable for a given Client ID/Secret pair, so you only need to run this once.

## Configure the plugin in SquaredUp

| Field | What it is | Required |
| --- | --- | --- |
| **Pod Base URL** | The base URL of your ConnectSecure pod, e.g. `https://pod401.myconnectsecure.com` — no trailing slash or path. | Yes |
| **Tenant Name** | Your ConnectSecure tenant name, exactly as configured on your account. Combined with your Client ID during authentication — must match exactly, including case. | Yes |
| **Client ID** | The API client ID issued by ConnectSecure. | Yes |
| **Client Secret** | The API client secret issued by ConnectSecure. Treated as a secret and masked in the UI. | Yes |
| **API User ID** | The `user_id` returned by the `/w/authorize` call above. Not your ConnectSecure login username — it's a value returned by the API itself. | Yes |

The plugin exchanges your Tenant Name, Client ID, and Client Secret for an access token automatically (and refreshes it as needed) — you never need to obtain or paste an access token yourself. The API User ID is the one value you retrieve manually, since ConnectSecure only returns it as part of a successful authorization call.

## What gets indexed

- **Company** — each managed company/customer in your ConnectSecure tenant (name, domain, location)
- **Agent** — every ConnectSecure agent installed across your managed companies (hostname, IP, OS, agent version, last check-in time), linked to its Company
- **Asset** — every scanned device across your managed companies (IP, platform, OS, hardware, importance), linked to its Company

## Dashboards

- **MSP Overview** — one table across every managed company: total assets, critical/high vulnerability counts, and compliance status, plus a rollup of how many companies currently have critical vulnerabilities outstanding
- **Company Detail** — scoped to a single company: stale/offline agents, asset inventory by OS/platform, and vulnerability breakdown by severity
- **Vulnerability Management** — cross-company severity breakdown and the companies with the most critical vulnerabilities
- **Compliance Status** — compliance assessment status per company, and companies with no recent assessment
- **Remediation Tracking** — remediation plans for a single company (affected assets and severity breakdown by solution) — intentionally company-scoped only, see limitations below

## Troubleshooting authentication

If you get an authentication error when adding the plugin, check these in order:

1. **API User ID isn't your login username.** It's the `user_id` field from the `/w/authorize` response (step 4 above) — a different value from your ConnectSecure portal username.
2. **Tenant Name must match exactly**, including case, as configured in ConnectSecure — not a display name or nickname you use informally.
3. **Pod Base URL has no trailing slash or path** — just the scheme and host, e.g. `https://pod401.myconnectsecure.com`.
4. **Client ID/Secret are the API credentials from Settings > Users > API Key**, not your own portal login credentials.
5. If all fields look correct, re-run the `curl` command in step 4 above with the same values — if that fails too, the Client ID/Secret/Tenant Name combination itself is wrong and you'll need to re-check or reissue them with ConnectSecure support.

## Known limitations

- **Rate limits.** ConnectSecure enforces hard platform-wide limits of 300 requests/minute, 2,000/hour, and 30,000/day — these apply across your whole tenant, not per plugin. This plugin requests large pages (up to 5,000 records) to minimize call volume, but MSPs with a very large number of managed companies should be mindful of how often dashboards using the **Remediation Tracking** stream are refreshed, since that endpoint requires one API call per company.
- **Remediation plans are company-scoped only.** The ConnectSecure API requires a `company_id` for this endpoint — there is no efficient way to pull remediation data for every managed company in one call, so this stream is only usable when scoped to a single company (e.g. via the Company Detail or Remediation Tracking dashboard), never as an account-wide tile.
- **No historical trending.** Several streams (company stats, vulnerabilities, compliance assessments) reflect current state rather than a queryable time range — the underlying ConnectSecure API does not expose a historical time-series for this data.
- **Vulnerability severity must be scoped to keep tiles fast.** A single MSP tenant can have tens of thousands of open vulnerabilities across all managed companies. The Vulnerabilities stream defaults to Critical severity and requires picking a severity level; leaving severity at High or Medium **and** not scoping to a single company can return enough rows to exceed the platform's response size limit for very large tenants — scope to a company, or stick to Critical, for an account-wide tile.
- **Build an Agents or Assets tile scoped to a company.** Both streams can return thousands of rows across a large MSP's full managed fleet — an unscoped, account-wide Agents or Assets tile can exceed the platform's response size limit for tenants with a large device count. Scope these tiles to a single company (as the Company Detail dashboard does) rather than adding them account-wide.
- **Credentials are tenant-wide.** The client ID/secret pair grants access to every company visible to that API user in ConnectSecure — there's no way to restrict a single plugin configuration to a subset of managed companies.
