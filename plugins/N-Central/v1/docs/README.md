Monitor your [N-able N-central](https://www.n-able.com/products/n-central) managed estate in SquaredUp — service organizations, customers, sites, and devices, along with device inventory, service monitoring status, lifecycle info, and active issues — via the [N-central REST API](https://developer.n-able.com/n-central/docs).

> ⚠️ Requires an N-central server on a version that exposes the REST API (N-central 2023.9 or later). The legacy SOAP API is not supported by this plugin.

## Setup

You will need your N-central server's base URL and a **User-API Token**.

1. Sign in to your N-central server as a user with API access.
2. Go to **Administration → User Management → Users**, click the user you want to use for API access, then go to the **API Access** tab.
3. Click **Generate JSON Web Token** and copy the token — it is shown only once. This is your **User-API Token**.
4. Paste your N-central server's base URL (e.g. `https://yourserver.n-able.com`) into the **Server URL** field, and the User-API Token into the **API Token** field.

The plugin exchanges the User-API Token for a short-lived access token itself via `POST /api/auth/authenticate`, but only when the cached access token has expired — the token is cached and refreshed automatically between requests, so no manual token exchange or periodic refresh is needed.

## Configuration fields

| Field | What it is | Where to find it | Required |
| ----- | ---------- | ----------------- | -------- |
| **Server URL** | The base address of your N-central server. | Your browser's address bar when signed in to N-central. | Yes |
| **User-API Token** | A long-lived JWT used to automatically obtain access tokens for every API call. | Administration → User Management → Users → [user] → API Access → Generate JSON Web Token — see Setup above. | Yes |

On save, the plugin calls `GET /api/service-orgs` (a minimal authenticated probe) to confirm the User-API Token works; an invalid, unreachable, or revoked token fails setup with an authentication error.

## What this plugin monitors

- **Organizational structure** — service organizations, customers, and sites, mirroring how your N-central estate is grouped.
- **Devices** — managed workstations, servers, network gear, mobile devices, and cloud services, with hardware/software inventory, service monitoring health, and warranty/lease/lifecycle info per device.
- **Active issues** — currently active alerts per customer, with the affected device and service named.

The out-of-the-box dashboards include an estate-wide **Overview** plus a perspective for each **Service Organization**, **Customer**, **Site**, and **Device**.

## Data streams

- **Device Assets** — hardware and software inventory for a device, one row per asset item (network adapter, patch, service, memory module, etc.).
- **Device Service Monitor Status** — current health of every monitored service/task on a device.
- **Device Lifecycle Info** — warranty, lease, purchase, and replacement dates for a device's hardware.
- **Customer Active Issues** — currently active alerts for a customer, naming the affected device and service.
- **Devices** — managed devices, filterable by customer or by site.
- **Service Org Customers** — customers belonging to a service organization.

## What gets indexed

| Object type | API source | Represents |
| ----------- | ---------- | ---------- |
| **Service Organization** | `GET /api/service-orgs` | A top-level MSP business unit. |
| **Customer** | `GET /api/customers` | A managed client. |
| **Site** | `GET /api/sites` | An optional location-based sub-group of a customer. |
| **Device** | `GET /api/devices` | A managed workstation, server, network device, mobile device, or cloud service. |

**Relationships:** each Customer links to its parent Service Organization; each Site links to its parent Customer; each Device links to its owning Customer, and — when it sits under a site rather than directly under the customer — to that Site as well.

## Known limitations

- **Service Organizations without data appear sparse** — the Service Organization perspective and its "Customers" tile depend on your N-central instance having Service Organizations configured; a single-SO or SO-less deployment will show little there even though Customers, Sites, and Devices are unaffected.
- **Sites are optional in N-central** — not every customer has sites configured; the Site perspective is limited to basic properties, as no site-specific monitoring data is exposed by the API.
- **Active issues have no documented severity mapping** — the API's `notificationState` field is a numeric code with no published severity scale, so it's shown as a raw number rather than a health indicator.
- **All data is current-state, not historical** — every stream reflects a snapshot at request time; the N-central REST API does not expose historical/time-series metrics, so no timeframe selection is available on any tile.
- **Read-only** — the plugin never creates, modifies, or deletes anything in N-central.
