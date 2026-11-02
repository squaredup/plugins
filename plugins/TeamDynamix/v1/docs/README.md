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
| **Import assets, configuration items, accounts and locations** | Adds each of these as an object in SquaredUp, so they appear in search and can be counted from the imported objects. Off by default: no tile or out-of-the-box dashboard needs them, and a large asset estate adds many objects. | Advanced options. | No |
| **Ignore certificate errors** | Accepts self-signed or otherwise untrusted certificates. Enable only when the Web API endpoint cannot present a certificate trusted by a public certificate authority — a self-hosted instance can still have a properly trusted certificate and should not need this. | Added by SquaredUp to every data source. | No |

On save, the plugin signs in, then checks that at least one TeamDynamix application is visible to the service account and that accounts and departments can be read. A failure at the first step means the address, BEID or Web Services Key is wrong, or the service account is inactive. A failure at the second means the credentials work but the service account has not been granted access to any application.

## What this plugin monitors

- **Service desk performance** — open backlog, tickets created and closed over time, SLA breaches, on-hold work, and how tickets break down by priority, type, service, department and assigned group.
- **Asset inventory** — assets by status, manufacturer and model, purchase value, ownership, and assets approaching their expected replacement date.
- **CMDB** — configuration items by type, owner and maintenance window.
- **Service delivery** — service catalog entries, knowledge base article coverage and review dates, and project health.
- **Time and effort** — time logged against tickets and projects, billable and non-billable.
- **Locations** — per-site ticket, asset, configuration item and user counts, which TeamDynamix rolls up for you.

The out-of-the-box dashboards are an organization-wide **Overview**, a **Service Desk** perspective for each ticketing application, a **Team Performance** dashboard for one or more teams, and an **Assets and CMDB** perspective for each asset application.

**Team Performance** is for a team lead or service manager. Pick one or more teams (TeamDynamix groups) in its **Team** variable and it shows their open backlog, what they opened and closed in the timeframe, how much was resolved by its due date, plain-language insights (capacity, SLA, aging, stale work, ownership, balance and priority), where the period's tickets went from team to classification to outcome, backlog aging, priority mix, per-technician workload, demand by service, when tickets arrive, and every open ticket with a link back to TeamDynamix. It doesn't need the ticketing application picked: the plugin finds the application the teams work in.

## Data streams

- **Tickets** — tickets in a ticketing application, one row per ticket, with status, priority, assignment and SLA. Choose whether the timeframe filters on created, last-modified or closed date, or set the timeframe to **None** for the current backlog regardless of date. Pick one or more imported groups under **Group(s)** to see only the tickets assigned to those teams; TeamDynamix does the filtering, so a team's tile isn't limited by the rest of the application's volume. Set **SLA** to **Violated only** to have TeamDynamix return only tickets that have breached their SLA. Tickets with no assigned person or group show **(Unassigned)**.
- **Team Tickets** — the same rows and options as **Tickets**, but scoped to one or more imported groups instead of an application. TeamDynamix ties tickets to an application rather than a group, so the plugin looks up which ticketing application the groups work in (one small request per group, remembered for an hour) and searches there, once for all the selected groups. If the groups work in different applications, the one most of them share is searched. A group with no ticketing application, such as a managers' group, has no tickets, so it shows no data.
- **Ticket Count** — the exact number of tickets matching a status, group, SLA and date filter, as one value. Use it for counts: it isn't limited by **Maximum tickets**, so it stays right on an application with thousands of open tickets, and it costs one small request.
- **Ticket Statuses** — the statuses configured in a ticketing application.
- **Assets** — assets in an asset application, filterable by in-service state.
- **Asset Count** — the exact number of assets in an asset application, optionally only those in or out of service, as one value. Like **Ticket Count**, it isn't limited by the maximum records setting.
- **Configuration Items** — standalone configuration items in the CMDB of an asset application, filterable by active state (active by default). TeamDynamix also creates a configuration item for every asset; those mirrors are left out, as the assets themselves are already available.
- **Projects** — projects in a project application, with health, schedule and budget.
- **Services** — service catalog services in a client portal application.
- **Knowledge Base Articles** — knowledge base articles in a client portal application. Article bodies are excluded.
- **Time Entries** — time logged against tickets, projects and tasks, account-wide.
- **Locations** — active locations with their ticket, asset, configuration item and user counts, account-wide.
- **Applications** — every active application the service account can see, with its Type and Class and the object type it's imported as. Use it to check which applications are recognised as ticketing or Assets/CIs applications.
- **Report** — the rows of a TeamDynamix Report Builder report, with the report's own columns. This is the way to get **custom attributes**: build a report in TeamDynamix (for example assets with a replacement-year attribute), add the attributes as columns, and pick it here. Only reports the admin service account can see are listed. The report's own filters and row limit apply, so filter it in Report Builder rather than in SquaredUp, and keep it well under 2,000 rows to stay inside the response size limit.
- **Accounts**, **Groups**, **Current User** — account-wide reference data. These back the import and setup checks and are hidden from the tile editor; the imported objects are visible in the graph instead. Four more hidden streams, **Accounts (Import)**, **Locations (Import)**, **Assets (Import)** and **Configuration Items (Import)**, feed the optional inventory import and return nothing while it's off.

## What gets indexed

| Object type | API source | Represents |
| ----------- | ---------- | ---------- |
| **TeamDynamix Ticketing App** | `GET /api/applications` (class `TDTickets`, or a type starting "Ticket") | A ticketing application, e.g. your service desk. Scope ticket tiles to one of these. |
| **TeamDynamix Asset App** | `GET /api/applications` (class `TDAssets`, or a type starting "Asset") | An asset and CMDB application. Scope asset and configuration item tiles to one of these. |
| **TeamDynamix Application** | `GET /api/applications` (everything else) | Any other application — client portal, projects or external. Scope project, service and knowledge base tiles to one of these. |
| **TeamDynamix Account** | `POST /api/accounts/search` | An account or department. Only with **Import assets, configuration items, accounts and locations** on. |
| **TeamDynamix Location** | `POST /api/locations/search` | An active physical location, with its rolled-up counts and coordinates. Only with the import option on. |
| **TeamDynamix Group** | `POST /api/groups/search` | A group used to assign and route work. |
| **TeamDynamix Asset** | `POST /api/{appId}/assets/search` | A tracked asset, up to **Maximum records per request** per asset application. Only with the import option on. |
| **TeamDynamix Configuration Item** | `POST /api/{appId}/cmdb/search/paged` | An active, standalone CMDB configuration item. Items that only mirror an asset are not imported. Only with the import option on. |

Applications and groups are always imported: every data stream is scoped to an application, and the **Group(s)** ticket filter, the **Team Tickets** stream and the **Team Performance** dashboard pick from the imported groups. The other types are optional because nothing in the plugin depends on them.

**Relationships:** assets and configuration items are imported per application, so each one carries the `appId` of the asset application it came from.

Because every ticket, asset and configuration item endpoint in TeamDynamix is scoped to an application, applications are imported first and everything else hangs off them. That is what lets you pick **Service Desk** by name in a tile rather than having to know its numeric application ID.

Tickets are deliberately **not** imported as objects. They are high-volume transactional records that change constantly, so they are queried live through the **Tickets** data stream instead. People are not imported either.

## Known limitations

- **List tiles are capped; counts aren't.** Each list tile makes one unpaged search, because walking TeamDynamix's paged searches (at most 250 records a page) is too slow for a tile. Each search is therefore capped (2000 records by default, set per tile for tickets, assets, knowledge base articles and time entries). A breakdown such as tickets by priority only covers the first 2000 matches, so narrow it with a status, group or timeframe filter. For a total, use **Ticket Count** or **Asset Count**, which are exact; the out-of-the-box count tiles already do.
- **Ticket tiles have a size ceiling.** Each ticket row is about 2.3 KB once SquaredUp has formatted it, and a tile's response can't exceed about 6 MB, so a ticket tile fails with a response-size error above roughly 2,500 tickets. Keep **Maximum tickets** at 2000 or below. Requestor email, respond-by and goes-off-hold dates, estimates, form and reference code aren't returned, to keep rows small.
- **Configuration item tiles stop at 10,000 standalone items.** TeamDynamix keeps a copy of every asset in the CMDB. The plugin asks for every configuration item type except **Asset**, so those copies are never loaded, at the cost of one extra request per asset application each hour to read its list of types. A tile loads at most 10,000 standalone items and shows at most **Maximum records per request** of them, most recently modified first; an application with more shows an error saying so.
- **The configuration item import has a ceiling too.** An import run allows about 220 requests, and the CMDB import reads 250 standalone items per request, so it covers roughly 50,000 standalone configuration items across all asset applications.
- **Imported assets are capped per asset application.** With the import option on, each asset application contributes at most **Maximum records per request** assets (2000 by default). An application with more assets than that is only partly imported. Asset tiles query TeamDynamix directly and aren't affected by the import.
- **Rate limits are per IP address and are easy to hit.** Ticket and time-entry searches allow 30 requests per minute; most other endpoints allow 60. TeamDynamix sets these per organization, and some are lower (one organization allows 30 for every endpoint, including sign-in). The plugin does not pace its own requests — a dashboard with many TeamDynamix tiles refreshing together can be throttled. Opening the **Service Desk** dashboard makes seven ticket searches (tiles with identical settings share one), and **Team Performance** makes three, because all twelve of its tiles read the same three searches. A custom dashboard of SQL tiles makes one search per table per tile, so a dashboard of a dozen such tiles can exceed the limit on every load: share settings between tiles, and use **Ticket Count** for totals. A throttled tile reports the time the limit resets and recovers on its own on the next refresh.
- **Custom attributes need a report.** TeamDynamix's search endpoints, which every other data stream uses, never return custom attributes or attachments; only loading one record at a time does, which is far too many requests for a tile. Build a Report Builder report with the attributes as columns and use the **Report** data stream instead. Custom attributes are not added to imported objects.
- **Wide records are trimmed.** A TeamDynamix ticket has over 100 fields, including the full HTML description and its attachment and task lists. Only dashboard-usable fields are returned, so ticket descriptions, attachments and task detail are not available.
- **Time entries identify people by UID.** The time search returns the person's unique identifier rather than their name, so time cannot be grouped by person name.
- **Sandbox paths follow an `SB` prefix.** A sandbox uses `/SBTDWebApi` for the Web API, and its ticket, asset, configuration item and knowledge base article links open in `/SBTDNext` or `/SBTDClient`. This has been checked against a real sandbox, but the API documentation doesn't cover web UI paths. If a sandbox connection fails with a "no Web API found" error, or a sandbox record's link doesn't open, check the paths with TeamDynamix support.
- **Unset dates and names are blank.** TeamDynamix sends `0001-01-01` rather than an empty value for a date that was never set, such as an asset with no expected replacement date or a ticket that isn't completed, and the name `None` for an unset manufacturer, model, location, department or service. The plugin blanks both, so they don't appear as a 1900 date or a "None" bar, and are excluded by **is not empty** filters.
- **Imports run every 12 hours** by default, so newly added groups, assets and configuration items appear in the graph on the next import. Turning the import option off removes the imported assets, configuration items, accounts and locations at the next import.
- **Read-only.** The plugin only ever reads from TeamDynamix. It calls no endpoint that creates, modifies or deletes data — only `GET` endpoints, `POST .../search` and `.../search/paged` endpoints, and the `POST /api/auth/loginadmin` sign-in call.

## Troubleshooting

| Message | Likely cause |
| ------- | ------------ |
| TeamDynamix rejected the BEID and Web Services Key (HTTP 401) | The BEID or Web Services Key is wrong, or the admin service account isn't set to **Active** in TDAdmin. |
| No TeamDynamix Web API found at … (HTTP 404) | The **Web API address** doesn't end in `/TDWebApi` (or `/SBTDWebApi` for a sandbox), or has the web app name (`/TDNext`) instead. |
| TeamDynamix didn't respond | The address is wrong or the site isn't reachable from SquaredUp. |
| TeamDynamix denied this request | The service account has no access to that application. Grant it in TDAdmin, then re-run the import. |
| The specified application could not be found | A custom tile is scoped to the wrong kind of application. Services and knowledge base articles need a client portal application, and projects a project application; the tile editor only offers those. |
| TeamDynamix rate limit reached | Too many TeamDynamix requests in the last minute, from this or other dashboards. The tile recovers after the reset time it shows. |
| Function.ResponseSizeTooLarge | A list tile returned more than about 6 MB. Lower **Maximum tickets** (or assets), or add a status, group or timeframe filter. |
| TeamDynamix rate limit reached while signing in | As above, but the sign-in request itself was throttled. The tile recovers after the reset time it shows. |
| This asset application's CMDB returned more than 10,000 configuration items | See **Configuration item tiles stop at 10,000 standalone items** above. |
| This data source hasn't picked up the plugin's latest sign-in script | A **Team Tickets** tile (or the **Team Performance** dashboard) on a data source added before version 1.2.0. Open the data source and select **Test and update**. |
| No TeamDynamix ticketing application is visible to the admin service account | A **Team Tickets** tile found no ticketing application at all. Grant the service account access to one in TDAdmin. |

To check the BEID and Web Services Key outside SquaredUp, sign in to TDAdmin and confirm both on the **Organization detail** page, and that the admin service account shows as **Active**.
