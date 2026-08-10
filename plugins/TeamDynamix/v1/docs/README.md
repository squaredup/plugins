Monitor your [TeamDynamix](https://www.teamdynamix.com/) service desk, asset estate and CMDB in SquaredUp — ticket volumes, SLA breaches, assignment backlogs, asset inventory and configuration items — via the TeamDynamix Web API.

> ⚠️ Requires an administrative service account (a **BEID** and **Web Services Key** pair). Tokens obtained by signing in as a normal user will not work, and reading these values in TDAdmin needs the **Add BE Administrators** permission — so a TeamDynamix administrator may need to supply them.

## Setup

You will need your organization's **BEID** and **Web Services Key**.

1. Sign in to **TDAdmin** on your TeamDynamix site (the **Admin** link in TDNext, or `https://yourorg.teamdynamix.com/TDAdmin`).
2. Open the **Organization detail** page. The **BEID** and **Web Services Key** are both shown there. If you can't see them, your account is missing the **Add BE Administrators** permission.
3. Confirm the admin service account is set to **Active** — an inactive account is rejected even when the key is correct.
4. Work out your Web API address: take the address you normally sign in at and replace the trailing application name with `TDWebApi`. If you sign in at `https://yourorg.teamdynamix.com/TDNext`, the Web API address is `https://yourorg.teamdynamix.com/TDWebApi`. For a sandbox environment, use the sandbox Web API path instead (usually `/SBTDWebApi`).
5. Paste all three values into the fields below and save.

## Configuration fields

| Field | What it is | Where to find it | Required |
| ----- | ---------- | ---------------- | -------- |
| **Web API address** | The base address of the TeamDynamix Web API, ending in `/TDWebApi`. | Your TeamDynamix site address with the application name replaced by `TDWebApi`. | Yes |
| **BEID** | A GUID identifying your TeamDynamix organization. Exchanged with the Web Services Key for a session token. | TDAdmin → **Organization detail**. | Yes |
| **Web Services Key** | The secret paired with the BEID. Stored encrypted and never displayed again. | TDAdmin → **Organization detail**. | Yes |
| **Maximum records per request** | Caps how many records a single search returns. Defaults to 2000. | Advanced options — leave as-is unless you hit the limits described below. | No |
| **Ignore certificate errors** | Accepts self-signed or otherwise untrusted certificates. Enable only when the Web API endpoint cannot present a certificate trusted by a public certificate authority — a self-hosted instance can still have a properly trusted certificate and should not need this. | Advanced options. | No |

On save, the plugin signs in, then checks that at least one TeamDynamix application is visible to the service account and that accounts and departments can be read. A failure at the first step means the address, BEID or Web Services Key is wrong, or the service account is inactive. A failure at the second means the credentials work but the service account has not been granted access to any application.

## What this plugin monitors

- **Service desk performance** — open backlog, tickets created and closed over time, SLA breaches, on-hold work, and how tickets break down by priority, type, service, department and assigned group.
- **Asset inventory** — assets by status, manufacturer and model, purchase value, ownership, and assets approaching their expected replacement date.
- **CMDB** — configuration items by type, owner and maintenance window.
- **Service delivery** — service catalog entries, knowledge base article coverage and review dates, and project health.
- **Time and effort** — time logged against tickets and projects, billable and non-billable.
- **Locations** — per-site ticket, asset, configuration item and user counts, which TeamDynamix rolls up for you.

The out-of-the-box dashboards are an organization-wide **Overview**, a **Service Desk** perspective for each ticketing application, and an **Assets and CMDB** perspective for each asset application.

## Data streams

- **Tickets** — tickets in a ticketing application, one row per ticket, with status, priority, assignment and SLA. Choose whether the timeframe filters on created, last-modified or closed date, or set the timeframe to **None** for the current backlog regardless of date.
- **Ticket Statuses** — the statuses configured in a ticketing application.
- **Assets** — assets in an asset application, filterable by in-service state.
- **Configuration Items** — configuration items in the CMDB of an asset application, filterable by active state.
- **Projects** — projects in a project application, with health, schedule and budget.
- **Services** — service catalog services in a client portal application.
- **Knowledge Base Articles** — knowledge base articles in a client portal application. Article bodies are excluded.
- **Time Entries** — time logged against tickets, projects and tasks, account-wide.
- **Locations** — active locations with their ticket, asset, configuration item and user counts, account-wide.
- **Accounts / Departments**, **Groups**, **Applications**, **Current User** — account-wide reference data. These back the import and setup checks and are hidden from the tile editor; the imported objects are visible in the graph instead.

## What gets indexed

| Object type | API source | Represents |
| ----------- | ---------- | ---------- |
| **TeamDynamix Ticketing App** | `GET /api/applications` (type `Ticketing`) | A ticketing application, e.g. your service desk. Scope ticket tiles to one of these. |
| **TeamDynamix Asset App** | `GET /api/applications` (type `Assets/CI`) | An asset and CMDB application. Scope asset and configuration item tiles to one of these. |
| **TeamDynamix Application** | `GET /api/applications` (all other types) | Any other application — client portal, projects or external. Scope project, service and knowledge base tiles to one of these. |
| **TeamDynamix Account** | `GET /api/accounts` | An account or department. |
| **TeamDynamix Location** | `GET /api/locations` | A physical location, with its rolled-up counts and coordinates. |
| **TeamDynamix Group** | `POST /api/groups/search` | A group used to assign and route work. |
| **TeamDynamix Asset** | `POST /api/{appId}/assets/search` | A tracked asset. |
| **TeamDynamix Configuration Item** | `POST /api/{appId}/cmdb/search` | A CMDB configuration item. |

**Relationships:** assets and configuration items are imported per application, so each one carries the `appId` of the asset application it came from.

Because every ticket, asset and configuration item endpoint in TeamDynamix is scoped to an application, applications are imported first and everything else hangs off them. That is what lets you pick **Service Desk** by name in a tile rather than having to know its numeric application ID.

Tickets are deliberately **not** imported as objects. They are high-volume transactional records that change constantly, so they are queried live through the **Tickets** data stream instead. People are not imported either.

## Known limitations

- **Searches are not paged, so results are capped.** The TeamDynamix search endpoints return a single unpaged result set — there is no way to walk through pages. Each search is therefore capped (2000 records by default, set per tile for tickets, assets, knowledge base articles and time entries). If a tile might exceed its cap, narrow it with a timeframe or a status filter rather than raising the cap, or the tile will silently show only part of your data.
- **The configuration item search cannot be capped by TeamDynamix at all.** Unlike tickets and assets, the CMDB search endpoint accepts no maximum-results parameter and has no paged alternative that doesn't require a pre-existing saved search in TeamDynamix. The plugin works around this by capping the result to **Maximum records per request** itself, keeping the most recently modified items first. If a very large, unfiltered CMDB still fails to load, filter to **Active** only and lower that setting.
- **Rate limits are per IP address and are easy to hit.** Ticket and time-entry searches allow 30 requests per minute; most other endpoints allow 60. The plugin paces its own requests to stay inside these limits, but a dashboard with many TeamDynamix tiles refreshing together can still be throttled. A throttled tile reports the time the limit resets and recovers on its own.
- **Custom attributes are not available.** TeamDynamix's search endpoints (the ones every data stream in this plugin uses) never return custom attributes, attachments, or a few other detail-only fields, regardless of what the underlying record supports — only loading a single ticket, asset, configuration item, project or service individually returns them, which none of these streams do. There is no way to surface a tenant's custom fields without adding a per-record detail call for every row, which the search-based design of this plugin does not do.
- **Wide records are trimmed.** A TeamDynamix ticket has over 100 fields, including the full HTML description and its attachment and task lists. Only dashboard-usable fields are returned, so ticket descriptions, attachments and task detail are not available.
- **Time entries identify people by UID.** The time search returns the person's unique identifier rather than their name, so time cannot be grouped by person name.
- **Sandbox paths are unverified.** The sandbox Web API path is assumed to be `/SBTDWebApi`, and ticket, asset, configuration item and knowledge base article links for a sandbox connection are built from the matching `/SBTDNext` or `/SBTDClient` web app path, following the same naming convention. Neither is confirmed against a real sandbox tenant, and the API documentation doesn't cover web UI paths at all. If a sandbox connection fails with a "no Web API found" error, or a sandbox record's link doesn't open, check the correct paths with TeamDynamix support.
- **Imports run every 12 hours** by default, so newly added assets and configuration items appear in the graph on the next import.
- **Read-only.** The plugin only ever reads from TeamDynamix. It calls no endpoint that creates, modifies or deletes data — only `GET` endpoints, `POST .../search` endpoints, and the `POST /api/auth/loginadmin` sign-in call.
