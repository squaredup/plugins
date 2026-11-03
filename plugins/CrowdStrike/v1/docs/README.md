Monitor [CrowdStrike Falcon](https://www.crowdstrike.com) host coverage, detections & incidents, vulnerabilities, and policy compliance in SquaredUp, via the [CrowdStrike Falcon API](https://developer.crowdstrike.com).

## Setup

You will need a CrowdStrike Falcon **API client** with read scopes for Hosts, Alerts, Spotlight Vulnerabilities, and Sensor Update/Prevention Policies.

1. Sign in to the [Falcon console](https://falcon.crowdstrike.com).
2. Go to **Support and resources → API clients and keys** and click **Add new API client**.
3. Give the client a name, and grant it **Read** scope for: **Hosts**, **Host Groups**, **Alerts**, **Spotlight Vulnerabilities**, **Sensor Update Policies**, **Prevention Policies**, and **Sensor Usage**.
4. Copy the generated **Client ID** and **Client Secret** — the secret is shown only once.
5. Note the **Cloud** your Falcon tenant runs in (US-1, US-2, EU-1 or US-GOV-1 / GovCloud) and select it in the form below, then enter the Client ID and Client Secret.

## Configuration fields

| Field | What it is | Where to find it | Required |
| ----- | ---------- | ----------------- | -------- |
| **CrowdStrike Cloud** | The regional API host your Falcon tenant is hosted in. | **Support and resources → API clients and keys** in the Falcon console. | Yes |
| **Client ID** | Identifies the API client used to authenticate requests. | **Support and resources → API clients and keys**. | Yes |
| **Client Secret** | Authenticates the API client via OAuth2 client-credentials. | Shown once when the API client is created. | Yes |

On save, the plugin checks the credentials with a minimal Hosts query (`GET /devices/queries/devices/v1`); an invalid Client ID/Secret, wrong Cloud region, or missing Hosts scope fails setup with an authentication error. This check does not test the other scopes, so a missing Alerts, Spotlight Vulnerabilities, policy or Sensor Usage scope only shows up on the tiles that use it.

## What this plugin monitors

- **Host coverage** — enrolled endpoints, platform/OS breakdown, sensor version, containment status, and Host Group membership.
- **Detections and incidents** — a unified view of Falcon Alerts (severity, status, tactic/technique, affected host), with computed detection and response latency.
- **Vulnerabilities** — open Spotlight findings per host, with CVE, CVSS score, exploit status and days-open.
- **Policy coverage** — Prevention and Sensor Update policies assigned to each Host Group.
- **Sensor usage** — account-wide weekly average of unique sensors reporting.

The out-of-the-box dashboards include an account-wide **Overview**, a **Host Group** perspective (select a Host Group/agency to see its coverage, alerts, vulnerabilities and policy compliance), and a **Host** perspective for a single device.

## Data streams

- **Host Count** — number of hosts, optionally by platform or containment status, from a single request (fast on large tenants).
- **Vulnerability Count** — number of Spotlight vulnerabilities by host/group, severity and status, from a single request.
- **Recently Seen Hosts** — the 100 most recently seen hosts.
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

**Relationships:** each Host's `groups` property references the Host Group(s) it belongs to (a host can belong to more than one group).

## Known limitations

- **Large tenants** — streams that list hosts, alerts or vulnerabilities page through every result, and one query can make at most 220 requests. Use the count streams for whole-tenant totals and scope list streams to a Host Group.
- **Incidents API not used** — the legacy `/incidents/*` API is deprecated (removed as of March 2026); this plugin uses the unified `/alerts/*` API for both detections and incidents.
- **Time-to-containment is not surfaced** — CrowdStrike's API exposes containment actions but not a completed-containment timestamp, so Response Latency here is the alert's `seconds_to_triaged` (time from creation to triage), not true time-to-containment. It is empty for alerts that haven't been triaged.
- **Host Group scoping for Alerts and Vulnerabilities is unverified** — filtering these by Host Group assumes the alert/vulnerability payload embeds the host's group membership (`device.groups` / `host_info.groups`); if CrowdStrike's response doesn't expose that field, Host-Group-scoped Alerts/Vulnerabilities tiles will need an alternate filter approach.
- **Sensor Usage column names are unverified** — the billing-dashboards-usage endpoint's exact response shape wasn't confirmed against live data; the stream surfaces whatever columns the API returns via a catch-all, so the default table tile may need column renaming once real data is seen.
- **Dashboard filters use assumed raw values** — the Overview tiles filter on assumed raw API values (alert `status` of `new`/`in_progress`/`closed`/`reopened`, host `status` of `contained`, and Spotlight severity values `CRITICAL`/`HIGH`/`MEDIUM`/`LOW` with status `open`); these should be checked against real payloads and adjusted if CrowdStrike's actual values differ.
- **Read-only** — the plugin never creates, modifies, or deletes anything in CrowdStrike Falcon.
- **Requires a paid Falcon subscription with API access** — a trial account may not expose all the scopes this plugin requests (Hosts, Host Groups, Alerts, Spotlight Vulnerabilities, Sensor Update Policies, Prevention Policies, Sensor Usage).
