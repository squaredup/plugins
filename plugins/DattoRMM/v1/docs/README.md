# Before you start

[Datto RMM](https://www.datto.com/rmm) is a cloud-based Remote Monitoring and Management (RMM) platform used by Managed Service Providers (MSPs) to monitor, manage and support client devices. This plugin lets you import your Datto RMM sites and devices into SquaredUp, and monitor open alerts scoped to individual sites.

## What is imported

The following objects are imported and kept in sync:

- **Sites** — each managed client site, including device counts (total, online, offline)
- **Devices** — all endpoints across all sites, including hostname, operating system, online status, last seen time, and internal/external IP addresses

## Data streams

| Data stream | Description |
|-------------|-------------|
| **All Devices** | Returns all devices across every site. Use this to build fleet-wide views or group by site. |
| **Open Alerts** | Returns open alerts scoped to an imported site object. Use this on site dashboards to surface active issues. |

## Setup

You will need the **Base URL**, **API Key** and **API Secret** for your Datto RMM account.

1. Log in to Datto RMM and navigate to **Setup** > **API**
2. Copy the **API URL** — this is your Base URL (e.g. `https://merlot-api.centrastage.net`)
3. Under **API Users**, create a new API user or select an existing one
4. Copy the **API Key** and **API Secret** for that user
