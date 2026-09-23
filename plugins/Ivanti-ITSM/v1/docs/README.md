Monitor your service desk in SquaredUp — incidents, service requests, changes, problems, knowledge articles and the CMDB — using the [Ivanti Neurons for ITSM](https://www.ivanti.com/products/itsm) [REST API](https://docs.ivanti.com/neurons-for-itsm/admin-user-help/enu/latest/rest-api). The plugin works against both the cloud service and an on-premises Ivanti Service Manager instance.

> ⚠️ This plugin is read-only. It never creates, updates, closes or deletes anything in Ivanti.

> ⚠️ Ivanti business objects are heavily customizable, so field and object names vary between tenants. The plugin ships with the out-of-the-box names; see [Adapting to a customized tenant](#adapting-to-a-customized-tenant) if yours differ.

## Before you start

You need the **Reference ID** of an Ivanti REST API key, and the tenant address you sign in to.

1. Sign in to the Ivanti **Configuration console** as an administrator.
2. Go to **Configure > Security Controls > API Keys**.
3. If there is no group for REST API keys yet, click **Add Key Group**, give it a name and description, and click **Save Key Group**.
4. Select that group and click **Add API Key**.
5. Fill in the new key:
    - **Reference ID** is generated for you — this is the value the plugin needs.
    - Tick **Activated**.
    - Set **On Behalf Of** to a service account, and **In Role** to the role that account should act as. The key inherits that role, so the role must be able to read incidents, service requests, changes, problems, knowledge articles and configuration items. A read-only role is enough.
6. Click **Save Key**, then copy the **Reference ID**. Ivanti documents these steps in full under [Using the REST API Key](https://docs.ivanti.com/neurons-for-itsm/admin-user-help/enu/latest/using-the-rest-api-key).
7. In SquaredUp, paste the tenant address into **Tenant URL** and the Reference ID into **REST API key**.

A key only works for the tenant it was created in, and optionally for the IP addresses listed against it. A key from a test tenant will be rejected by production.

## Configuration fields

| Field | What it is | Where to find it | Required |
| ----- | ---------- | ---------------- | -------- |
| **Tenant URL** | The address of the Ivanti instance, with no path. The plugin appends `/api/odata/businessobject/…` itself. | The address bar when you are signed in to Ivanti, for example `https://yourtenant.saasiteu.com`. | Yes |
| **REST API key** | Sent as the `Authorization: rest_api_key=…` header on every request. | Configuration console → **Configure > Security Controls > API Keys** → the key's **Reference ID**. | Yes |
| **Page limit** | The most records Ivanti returns in one request. Every tile and import is kept at or below it, and imports use it as their page size. | Set by an Ivanti administrator for the tenant — ask them for the value. It is 100 unless they have raised it. | No (defaults to 100) |
| **Configuration item filter** | An OData `$filter` limiting which configuration items are imported, for example `Status eq 'Active'`. | — | No |
| **API version** | Which REST API version to call — version 1 (`/api/odata/…`) or version 2 (`/api/odatav2/…`). Version 2 supports bracketed filters. | — | No (defaults to version 1) |
| **Team business object** | Which business object ticket-owning teams are imported from. The object must expose the team name in a field called `Team`. | — | No (defaults to `standarduserteams`) |
| **Ignore certificate errors** | For an on-premises instance presenting an untrusted certificate. | — | No |

Everything below **REST API key** is optional and appears only when **Show advanced options** is ticked.

On save, SquaredUp calls the API for a single employee record to confirm the tenant URL and key are accepted, then reads one incident to confirm the key's role can see ticket data. An authentication failure here almost always means the key belongs to a different tenant, is deactivated, or is restricted to other IP addresses.

## What this plugin monitors

- **Service desk workload** — open incidents and service requests by status, priority, category, service and owning team, with an age in days on every row.
- **Change and problem management** — the change pipeline by status, and the open problem backlog.
- **The CMDB** — configuration items with their type, status, owner, location and hardware detail.
- **Knowledge** — knowledge base articles and their publication status.
- **Anything else** — the **Business Object Records** stream reads any business object in the tenant, including customer-defined ones, without a plugin change.

The out-of-the-box dashboards are a **Service Desk Overview**, a **Change And Problem Management** dashboard, and a perspective for each **Configuration Item** and **Team**.

## Data streams

- **Incidents** — incidents account-wide, filterable by status, owning team and an OData expression.
- **Service Requests** — service requests, with the same filters.
- **Changes** — change records, with the same filters.
- **Problems** — problem records, with the same filters.
- **Configuration Items** — configuration items from the CMDB, account-wide.
- **Teams** — ticket-owning teams, account-wide.
- **Knowledge Articles** — knowledge base articles, account-wide.
- **Business Object Records** — records from any named business object, with `$filter`, `$select` and `$orderby` passed through.

Every ticket stream returns the fields listed above **plus every other field the business object exposes**, so tenant-specific fields — SLA targets, custom categories, approval detail — appear in the tile editor's column list without any plugin change.

## What gets indexed

| Object type | API source | Represents |
| ----------- | ---------- | ---------- |
| **Configuration Item** | `GET /api/odata/businessobject/cis` | An item in the CMDB — server, workstation, application or service. |
| **Team** | `GET /api/odata/businessobject/standarduserteams` | A team that tickets are assigned to, matched to a ticket's `OwnerTeam`. |

**Relationships:** none. Tickets are not indexed as objects; they are queried live, and the **Team** perspective scopes ticket tiles by matching the team name against the ticket's `OwnerTeam` field.

Both import steps are optional, so a tenant that has renamed or restricted one of these business objects still imports the other. A step that cannot read its business object is reported as a warning on the data source rather than failing the whole import.

## Adapting to a customized tenant

Ivanti tenants routinely rename fields, add statuses and define their own business objects. Three things absorb that without a code change:

- **Status filters accept custom values.** The status list on each ticket tile is a suggestion — type any status this tenant uses and it is sent to the API as written.
- **What counts as "open" is a status list, not a flag.** The out-of-the-box tiles define open by excluding `Resolved`, `Closed` and `Cancelled` (plus `Fulfilled` for requests and `Implemented`/`Rejected` for changes). If this tenant retires tickets into some other status, add it to the tile's **Additional filter** as `Status ne '<that status>'`, or the tile will count abandoned tickets as open. Ivanti's own `IsInFinalState` field is not a substitute: it cannot be filtered on, and it reads `false` on cancelled records.
- **The additional filter field** on every tile takes a raw OData `$filter`, so you can filter on fields the plugin does not know about. It is combined with whatever the tile already filters on using `and`.
- **Business Object Records** reads any object by its API name. The API name is the business object name with an `s` on the end — `incidents`, `tasks`, `alerts`, `employees` — and the same rule applies to customer-defined objects.

If **Team business object** needs changing, confirm the object first: compare the `OwnerTeam` values actually in use on tickets against the names in the candidate object. Contact groups are a common wrong answer - in a stock tenant they hold advisory and approval boards rather than ticket-owning teams.

## Known limitations

- **Ivanti caps each request at the tenant page limit, 100 by default.** Ivanti rejects a request above the limit with `You cannot query more than 100 records` rather than returning fewer rows. Set **Page limit** to the value your Ivanti administrator has configured; a tile's own **Maximum records** is capped at it, so a tile never asks for more than the tenant allows. Ticket tiles make a single request rather than paging, so a count on a backlog larger than the limit under-reports. Narrow the tile with its status, team or filter parameters, or ask the administrator to raise the limit. Configuration items, teams and knowledge articles are paged, so they are not affected.
- **Wide business objects can be slow or too large.** An Ivanti record carries every field the tenant has defined, which for incidents can be hundreds of columns. If a tile times out or fails with a response-size error, set its **Field(s)** parameter to just the columns that tile uses — that is usually a tenfold reduction in payload.
- **Sort order decides what a truncated result keeps.** Ivanti applies `$orderby` before the record ceiling. Ticket tiles default to newest-first, so a tile about the oldest records needs its **Order by** field set accordingly — the **Oldest Open Incidents** tile does this.
- **Large result sets can exceed the response limit.** A tile that returns many thousands of wide records can fail with a response-size error. Use the **Configuration item filter** on the data source to keep a large CMDB import manageable.
- **Date filtering is applied by Ivanti, not by SquaredUp.** Selecting a timeframe adds an OData comparison on the date field chosen in the tile's **Timeframe applies to** setting, as an unquoted ISO-8601 literal such as `2016-07-24T23:42:48Z`. Tiles default to the **None** timeframe — the current backlog — so the out-of-the-box dashboards do not depend on it.
- **Only eight filter operators.** Ivanti supports [`eq`, `ne`, `lt`, `le`, `gt`, `ge`, `and` and `or`](https://docs.ivanti.com/neurons-for-itsm/admin-user-help/enu/latest/get-business-object-by-filter) — there is no `contains`, `startswith` or `not`, so the **Additional filter** field cannot do partial text matching.
- **Selecting several statuses or teams at once needs API version 2.** Combining an OR-group with another condition requires brackets, which only version 2 of the API supports. On version 1, filter on one status and one team at a time, or switch **API version** to version 2.
- **Field names are tenant-specific.** Columns such as `Priority`, `OwnerTeam` and `ProfileFullName` are the out-of-the-box names. Where a tenant has renamed one, the named column is empty and the tenant's own field appears alongside it instead.
- **No deep links back into Ivanti.** Record URLs are not constructible from the API response, so table rows do not link to the record in Ivanti.
- **Read-only.** The plugin never creates, modifies or deletes anything in Ivanti, and does not use the create, update, quick action or attachment APIs.

## Acknowledgements

Built with **Eric Bragg**, who shaped the design and tested every version against a live on-premises Ivanti instance. The business object names, field names and API limits this plugin ships with are correct because he verified them rather than left them as assumptions.
