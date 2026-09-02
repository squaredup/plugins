Monitor [CrowdStrike Falcon](https://www.crowdstrike.com) host coverage, detections & incidents, vulnerabilities, and policy compliance in SquaredUp, via the [CrowdStrike Falcon API](https://developer.crowdstrike.com).

## Setup

You will need a CrowdStrike Falcon **API client** with read scopes for Hosts, Alerts, Spotlight Vulnerabilities, and Sensor Update/Prevention Policies.

1. Sign in to the [Falcon console](https://falcon.crowdstrike.com).
2. Go to **Support and resources → API clients and keys** and click **Add new API client**.
3. Give the client a name, and grant it **Read** scope for: **Hosts**, **Host Groups**, **Alerts**, **Spotlight Vulnerabilities**, **Sensor Update Policies**, **Prevention Policies**, and **Sensor Usage**.
4. Copy the generated **Client ID** and **Client Secret** — the secret is shown only once.
5. Note the **Cloud** your Falcon tenant runs in (shown on the same page, e.g. `api.us-2.crowdstrike.com`) and paste the three values into the fields below.

## Configuration fields

| Field | What it is | Where to find it | Required |
| ----- | ---------- | ----------------- | -------- |
| **CrowdStrike Cloud** | The regional API host your Falcon tenant is hosted in. | **Support and resources → API clients and keys** in the Falcon console. | Yes |
| **Client ID** | Identifies the API client used to authenticate requests. | **Support and resources → API clients and keys**. | Yes |
| **Client Secret** | Authenticates the API client via OAuth2 client-credentials. | Shown once when the API client is created. | Yes |

On save, the plugin validates the credentials with a minimal Hosts query; an invalid Client ID/Secret, wrong Cloud region, or missing scope fails setup with an authentication error.

## What this plugin monitors

- **Host coverage** — enrolled endpoints, platform/OS breakdown, sensor version, containment status, and Host Group membership.
- **Detections and incidents** — a unified view of Falcon Alerts (severity, status, tactic/technique, affected host), with computed detection and response latency.
- **Vulnerabilities** — open Spotlight findings per host, with CVE, CVSS score, exploit status and days-open.
- **Policy coverage** — Prevention and Sensor Update policies assigned to each Host Group.
- **Sensor usage** — account-wide weekly average of unique sensors reporting.

The out-of-the-box dashboards include an account-wide **Overview**, a **Host Group** perspective (select a Host Group/agency to see its coverage, alerts, vulnerabilities and policy compliance), and a **Host** perspective for a single device.

## Data streams

- **Devices** — host inventory (platform, OS, sensor version, network, group membership, policy applied state), account-wide or scoped to a Host or Host Group.
- **Alerts** — detections and incidents from the unified Falcon Alerts API, account-wide or scoped to a Host or Host Group, with a Status filter.
- **Vulnerabilities** — open Spotlight vulnerability findings, account-wide or scoped to a Host or Host Group, with a Status filter.
- **Prevention Policies** — Prevention policies assigned to a Host Group.
- **Sensor Update Policies** — Sensor Update policies assigned to a Host Group.
- **Sensor Usage** — weekly average unique sensor count, account-wide.

## What gets indexed

| Object type | API source | Represents |
| ----------- | ---------- | ---------- |
| **CrowdStrike Host Group** | `GET /devices/combined/host-groups/v1` | A Falcon Host Group (used here to represent an agency). |
| **CrowdStrike Host** | `GET /devices/combined/devices/v1` | An enrolled endpoint (workstation, server, etc.). |

**Relationships:** each Host's `group_ids` property references the Host Group(s) it belongs to (a host can belong to more than one group).

## Known limitations

> ⚠️ **This build has not been tested against a live CrowdStrike tenant.** It was authored from CrowdStrike's published API documentation and an endpoint reference list, but no CrowdStrike API credentials were available during development, so no data stream has been exercised against real data and no import has been run. Every field name, filter expression, and response shape below should be verified — and adjusted if needed — against a real Falcon tenant before this plugin is relied on.
- **Incidents API not used** — the legacy `/incidents/*` API is deprecated (removed as of March 2026); this plugin uses the unified `/alerts/*` API for both detections and incidents.
- **Time-to-containment is not surfaced** — CrowdStrike's API exposes containment actions but not a completed-containment timestamp, so response-latency here is measured as alert `created` → `updated` (when closed), not true time-to-containment.
- **Host Group scoping for Alerts and Vulnerabilities is unverified** — filtering these by Host Group assumes the alert/vulnerability payload embeds the host's group membership (`device.groups` / `host_info.groups`); if CrowdStrike's response doesn't expose that field, Host-Group-scoped Alerts/Vulnerabilities tiles will need an alternate filter approach.
- **Sensor Usage column names are unverified** — the billing-dashboards-usage endpoint's exact response shape wasn't confirmed against live data; the stream surfaces whatever columns the API returns via a catch-all, so the default table tile may need column renaming once real data is seen.
- **Dashboard filters use assumed raw values** — the Overview KPI/donut tiles filter on assumed raw API values (alert `status` of `new`/`in_progress`/`closed`/`reopened`, device `status` of `contained`, a CVSS-score threshold as a proxy for "Critical/High" severity); these should be checked against real payloads and adjusted if CrowdStrike's actual values differ.
- **Account-wide tiles on unscoped consolidated streams** (Devices/Alerts/Vulnerabilities on the Overview dashboard) omit the scope binding entirely, per the documented pattern for an empty selection — if this throws a `nodeIds` error on a live tenant, the fix is to bind an explicit empty selection instead.
- **Read-only** — the plugin never creates, modifies, or deletes anything in CrowdStrike Falcon.
- **Requires a paid Falcon subscription with API access** — a trial account may not expose all the scopes this plugin requests (Hosts, Host Groups, Alerts, Spotlight Vulnerabilities, Sensor Update Policies, Prevention Policies, Sensor Usage).
