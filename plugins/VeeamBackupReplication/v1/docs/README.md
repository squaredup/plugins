# Veeam Backup & Replication

This plugin connects to a **Veeam Backup & Replication (VBR)** server through its REST API and brings your backup estate into SquaredUp — repositories and jobs as objects, their live status and capacity as data streams, and ready‑made dashboards for both.

## What this plugin monitors

- **Backup repositories** — indexed as objects, with capacity / free / used space, online status and location.
- **Backup jobs** — indexed as objects, with current status, last‑run result (Success / Warning / Failed), schedule and session details.
- **Object‑scoped status** — pick specific jobs or repositories on a tile's **Objects** tab and see just those.
- **Out‑of‑the‑box dashboards** — an Overview plus per‑object "Status" perspectives (see [Dashboards](#dashboards)).

## Prerequisites

1. **Veeam Backup & Replication 12.0 – 13** with the REST API service running. The REST API listens on HTTPS port **9419** by default — confirm it is reachable by opening `https://<your-vbr-server>:9419/api/swagger/ui/index.html` in a browser on the same network.
2. **A user account** that can sign in to VBR with at least the **Veeam Backup Viewer** role (read‑only is sufficient). A local Windows account or a domain account both work.
3. **Network connectivity** from SquaredUp to the server on port 9419. VBR is normally on‑premises, so you will usually connect this data source through a **SquaredUp Agent** (relay) that can reach the server. The plugin is *hybrid* — it can run in the cloud or via an agent.

## Getting / preparing credentials

The plugin authenticates with the **username and password** of a VBR account (OAuth2 *password* grant — SquaredUp exchanges them for a short‑lived access token and refreshes it automatically). No client ID / secret is required.

- Use a dedicated monitoring account where possible, with the **Veeam Backup Viewer** role.
- For **domain accounts**, enter the username in `DOMAIN\user` form (for example `CONTOSO\svc-squaredup`).

## Configuration fields

| Field | Required | Description |
|---|---|---|
| **Server URL** | Yes | The bare root of your VBR server — scheme, host and REST API port only, e.g. `https://vbr01.contoso.com:9419`. **Do not** add a path such as `/api/v1`; the plugin appends it. |
| **Username** | Yes | A VBR account with at least the Veeam Backup Viewer role. Domain accounts use `DOMAIN\user`. |
| **Password** | Yes | The password for the account above. |
| **REST API version** | Yes | The `x-api-version` revision sent on every request. Pick the revision matching your server — see [Choosing the REST API version](#choosing-the-rest-api-version). Defaults to `1.3-rev1`. |
| **Ignore certificate errors** | No | Enable when the server presents a self‑signed certificate. |

### Choosing the REST API version

Every request carries an `x-api-version` header. **Choose the highest revision your Veeam server supports** — each maps to a specific build:

| Revision | Veeam build |
|---|---|
| `1.3-rev1` (default) | 13.0.1 |
| `1.3-rev0` | 13.0.0 |
| `1.2-rev1` | 12.3.1 |
| `1.2-rev0` | 12.3.0 |
| `1.1-rev2` | 12.2 |
| `1.1-rev1` | 12.1 |
| `1.1-rev0` | 12.0 |

> Choosing a revision **older** than your server can cause errors, because the server may return values (such as a `Stopped` job status) that the older schema cannot represent. When in doubt, use the highest revision your server supports.

## What gets indexed

| Object type | Represents | Key properties |
|---|---|---|
| **Veeam Repository** | A backup repository | repository type, description, host, path |
| **Veeam Job** | A backup job | job type, description |

## Data streams

| Data stream | Scope | Returns |
|---|---|---|
| **Job Status (All)** | All jobs | Every job's status, last result, last/next run, repository, session details |
| **Repository Status (All)** | All repositories | Every repository's capacity, free/used space (GB), online status, host and path |
| **Job Status** | Selected job(s) | Same as *Job Status (All)*, filtered to the jobs you pick on the **Objects** tab |
| **Repository Status** | Selected repository(ies) | Same as *Repository Status (All)*, filtered to the repositories you pick |

The two scoped streams (**Job Status** / **Repository Status**) filter **server‑side** — one request per selected object using the API's `idFilter` — and require at least one object to be selected. Notable column shapes: **Last Result** renders as a health dot (Success 🟢 / Warning 🟠 / Failed 🔴 / None ⚪), capacity/free/used render as **GB**, and job progress as a **percentage**.

## Dashboards

- **Overview** (global): jobs by last result and by status (donuts), lists of jobs whose last run **Failed** or ended in **Warning**, a repositories table, a **% Free Space** breakdown, and any **repositories that are not online**.
- **Job → Status** (per job): current status, last result, last / next run times, and full job properties.
- **Repository → Status** (per repository): online status, capacity, free and used space, **% free space**, and full repository properties.

The per‑object dashboards appear as perspectives when you view a Veeam Job or Veeam Repository.

## Compatibility

- **Runtime‑tested against Veeam 13 (`1.3-rev1`).** Earlier versions (12.0 – 12.3) are supported through the matching REST API revision above; the endpoints the plugin uses exist in all of these revisions, but they have not been end‑to‑end tested by SquaredUp Labs.
- **Hybrid** — runs in the SquaredUp cloud or through an agent; on‑premises servers require an agent.

## Known limitations

- **On‑premises connectivity** — because VBR is usually on‑premises, a SquaredUp Agent is normally required to reach the server on port 9419.
- **Self‑signed certificates** — VBR defaults to a self‑signed certificate; enable *Ignore certificate errors* if you have not installed a trusted one.
- **REST API version must not be older than the server** — the `x-api-version` is sent on every request. If you upgrade VBR, raise the field to match (see above).
- **Object‑scoped streams need a selection** — *Job Status* / *Repository Status* make no request until at least one object is chosen; use the *(All)* streams for an unfiltered view.
- **Permissions** — the account must have at least the Veeam Backup Viewer role, or requests are rejected.

## Troubleshooting

| Symptom | Likely cause & fix |
|---|---|
| **HTTP 400 on the token request** | Credentials rejected — check the username/password and that the account can sign in to VBR (domain accounts need `DOMAIN\user`). |
| **HTTP 404 on every request** | The **Server URL** is wrong — it must be the bare root including the `:9419` port, with **no** `/api/v1` and no trailing slash. |
| **HTTP 500 mentioning an enum (e.g. `EJobStatus … Stopped`)** | The selected **REST API version** is older than your server. Raise it to the revision matching your build. |
| **A scoped tile shows no data** | *Job Status* / *Repository Status* need at least one object selected on the **Objects** tab. |
| **TLS / certificate error** | Enable **Ignore certificate errors** (VBR uses a self‑signed certificate by default). |

## Additional resources

- [Veeam Backup & Replication REST API reference (1.3-rev1)](https://helpcenter.veeam.com/references/vbr/13/rest/1.3-rev1/tag/SectionOverview)
- Swagger UI on your server: `https://<your-vbr-server>:9419/api/swagger/ui/index.html`
