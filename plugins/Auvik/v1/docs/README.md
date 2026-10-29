Monitor the networks you manage in [Auvik](https://www.auvik.com) from SquaredUp. The plugin covers device and interface status, performance metrics, alerts, hardware health, configuration backups, and warranty and lifecycle coverage across every Auvik site you can access, using the [Auvik API](https://auvikapi.us1.my.auvik.com/docs).

## Setup

You will need an Auvik **username** and **API key**. Auvik recommends a dedicated service account.

1. Sign in to Auvik as an administrator and go to **Settings → Users & Roles**.
2. Create a user for SquaredUp and give it a role with read permission on these APIs: **Alerts**, **Audit history**, **Components**, **Configuration history**, **Device details**, **Device info**, **Entity notes**, **Hardware lifecycle**, **Interface info**, **Network details**, **Network info**, **Statistics**, **Tenants** and **Usage**. The built-in **API access only** role covers all of these except **Statistics**, so edit it, or copy it into a custom role, and enable **Statistics** as well. Without it, the **Metrics** stream fails with a permission error. See [API Access Only Role and Service Account Configuration](https://support.auvik.com/hc/en-us/articles/48529381648660-API-Access-Only-Role-and-Service-Account-Configuration-in-Auvik).
3. Authorize the user on the sites (tenants) you want to monitor. Authorizing it on a multi-site includes that multi-site's child sites.
4. Sign in as that user, click the username in the side navigation bar, open the profile settings and click **Generate API Key**. Copy the key, which is shown only once. See [Generate and manage Auvik API keys](https://support.auvik.com/hc/en-us/articles/54560576431636-Generate-and-manage-Auvik-API-keys).
5. In SquaredUp, enter the user's email address as the **Username** and paste the key into **API key**.
6. Choose the **Region** shown in your Auvik dashboard address. For example, `https://example.us1.my.auvik.com` is region **us1**. See [Auvik regions](https://support.auvik.com/hc/en-us/articles/360033412992-Auvik-regions).
7. Optionally, enter the **Domain prefix** from the same address (`example` above) so tenants show their display names, and choose whether to monitor all tenants or only specific ones.

## Configuration fields

| Field | What it is | Where to find it | Required |
| --- | --- | --- | --- |
| **Username** | The email address of the Auvik user the API key belongs to. Used as the basic auth username. | The user's sign-in email in Auvik. | Yes |
| **API key** | The user's Auvik API key. Used as the basic auth password. | Auvik → username in the side navigation bar → profile settings → **Generate API Key**. | Yes |
| **Region** | The Auvik cluster that hosts your account: `us1`–`us6`, `lnx`, `eu1`, `eu2`, `au1` or `ca1`. | The part between your domain prefix and `.my.auvik.com` in the Auvik dashboard address. | Yes (defaults to `us1`) |
| **Domain prefix** | The domain prefix of your main Auvik account. When set, tenants show their display names, plus enabled, subscription and running status and their address. Without it, tenants are named by their domain prefix. | The first part of the Auvik dashboard address, e.g. `example` in `https://example.us1.my.auvik.com`. | No |
| **Tenants** | Whether to monitor **All tenants the user can access**, or **Specific tenants only**. | | Yes (defaults to all) |
| **Tenant IDs** | Shown when **Specific tenants only** is chosen. The tenant IDs to monitor, added one at a time. Only these tenants, and their devices and networks, are imported and queried. | The **Tenants** data stream, or the **ID** of an imported tenant. | When shown |

When you save, the plugin checks the credentials against Auvik's credential check endpoint and then lists your tenants. If authentication fails, the username, API key or region is wrong. If authentication succeeds but no tenants are returned, the user isn't authorized on any site, or its role lacks the **Tenants** API permission.

## What this plugin monitors

- **Inventory and status.** Every discovered device with online status, type, vendor, model, software and firmware, serial number, IP addresses and networks. Also SNMP, WMI, login and VMware discovery status and whether the device is managed. Networks and VLANs, interfaces and ports, and hardware components.
- **Performance.** A single **Metrics** stream covers every Auvik statistic. For devices: CPU, memory and storage utilization, bandwidth, packet rates, uptime and outages. For interfaces: bandwidth, utilization, packet loss and discards. For hardware: temperature, fan speed, power supply, disk throughput and latency. For internet connection checks: round-trip time and packet loss.
- **Alerts.** Triggered alerts with severity, status, affected device or network, dismissal and dispatch state, and any external tickets.
- **Asset lifecycle.** Warranty and service coverage with expiry dates, vendor end-of-sale and end-of-support status, and configuration backup history.
- **Activity and billing.** Remote terminal, tunnel and remote browser sessions; notes recorded against devices and networks; billable usage per tenant.

The out-of-the-box dashboards are an estate-wide **Overview**, an **Alerts** dashboard and an **Asset Lifecycle** dashboard, plus a perspective for each **Tenant**, **Device** and **Network**.

## Data streams

- **Metrics**: time series for any Auvik statistic, chosen with the **Metric** parameter. Returns one row per data point and series (for example Transmit, Receive or Total), with a readable unit. Device series are named with the device name and the end of its ID, so devices that share a name stay separate. Covers the whole estate, or can be filtered to devices (for interface and hardware metrics, the interfaces and components on those devices) and to tenants. **Granularity** is automatic unless you override it: minute data for up to 12 hours on a single device, or up to 1 hour across many devices, then hourly data up to 7 days across many devices (31 days on one device), then daily data.
- **Devices**: discovered devices with status, inventory and discovery details. Covers the whole estate; filter by device, tenant, network, device type or online status.
- **Device Support**: warranty and service coverage, or vendor lifecycle status (set with **Coverage**), one row per device. Auvik only has this data for devices it has matched to vendor records; when filtered to a device it has no record for, the stream returns a **Not reported** row, as long as the estate has no more than 500 records.
- **Networks**: discovered networks and VLANs with type, scan status, scope, collectors and device count.
- **Interfaces**: interfaces and ports with operational and admin status, speed, duplex, MAC and IP addresses, and the networks they're on. Filter by device, tenant or status.
- **Components**: hardware components (CPUs, disks, fans, memory, power supplies, storage controllers and system boards) with their health (OK, degraded or failed).
- **Alerts**: alerts triggered in the timeframe, one row per alert, with the device, interface, network or tenant it affects. Auvik records an alert clearing, and a pause ending, as a separate event; the plugin folds it into the alert or pause, so each shows as **Open**, **Paused** or **Resolved** with the time it ended. When the timeframe holds more than 500 alerts, that time can be blank for one whose ending Auvik returned on a different page. Filter by device or network, tenant, severity or dismissal. **Status** instead returns Auvik's own records of one kind, by when each happened in the timeframe: **Opened** (alerts raised and not yet cleared), **Paused** (alerts paused on a device or network), **Resolved** (alerts clearing) or **Unpaused** (pauses ending). Auvik filters alerts only by when each event happened, so an alert raised before the timeframe that is still open isn't returned; use a longer timeframe to reach it.
- **Configuration Backups**: configuration backups taken in the timeframe, their age, and whether each is the running configuration. Choose **Current running only** to get each device's current running configuration whatever its age, for example to find devices whose backups are stale.
- **Remote Sessions**: remote terminal, tunnel and remote browser sessions started in the timeframe, with user, status and duration.
- **Notes**: notes recorded in Auvik against devices, interfaces, networks and tenants.
- **Tenants**: the sites and multi-sites the user can access, with type and parent.
- **Usage**: billable device days, client days, peak monitored servers and workstations, and SaaS Management users for each tenant.

## What gets indexed

| Object type | API source | Represents |
| --- | --- | --- |
| **Tenant** | `GET /v1/tenants` (`/v1/tenants/detail` when **Domain prefix** is set) | An Auvik site, multi-site or corporate IT account. |
| **Device** | `GET /v1/inventory/device/info` | A device Auvik has discovered, such as a switch, router, firewall, access point or server. |
| **Network** | `GET /v1/inventory/network/info` | A network or VLAN Auvik has discovered. |

**Relationships:** each Device and Network belongs to its Tenant. Each Device is on the Networks Auvik saw it on. Each site belongs to its parent multi-site.

Objects are re-imported every 12 hours, so properties such as a device's online status on the object itself can be up to 12 hours old. The **Devices** stream always returns live status.

## Known limitations

- **Interfaces and components aren't indexed.** Large estates have hundreds of thousands of them, which is more than an import can hold. Use the **Interfaces**, **Components** and **Metrics** streams filtered to a device instead.
- **Statistics range limits.** Auvik returns minute data for at most 1 day per query, hourly data for at most 31 days, and daily data for at most 1 year. **Granularity** coarsens automatically to fit the timeframe, and timeframes longer than a year are shortened to the most recent year. Auvik also rolls minute data up into coarser points as it ages.
- **Large estate-wide queries.** Unfiltered **Interfaces** queries, interface and hardware **Metrics** across the whole estate, and minute-granularity **Metrics** across many devices can return more data than a single tile can hold, or take longer than a tile allows. Filter to a device or tenant, or use a coarser granularity.
- **Filtering several devices.** Filtering **Metrics**, **Interfaces**, **Components** or **Configuration Backups** to one device is done by Auvik. Filtering to several devices fetches the wider result and filters it in SquaredUp, which is slower on large estates.
- **Alerts on interfaces.** Alerts raised on an interface are linked to the interface, not its device, so a device's alert list doesn't include its interface alerts.
- **Usage is daily.** **Usage** timeframes start at the last 7 days.
- **Rate limit.** Auvik allows 2,500 API requests per 5 minutes from one source. Dashboards with many tiles over many tenants count towards this.
- **Read-only.** The plugin never changes anything in Auvik. For example, it never dismisses alerts.
- **Not covered.** Auvik SaaS Management (applications, users and security logs), SNMP poller settings and history, and per-device-type extended details.
