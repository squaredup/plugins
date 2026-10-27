Monitor your clients' networks in SquaredUp using [Domotz](https://www.domotz.com) — collector and device status, outages, alerts, uptime and internet speed — via the [Domotz Public API](https://portal.domotz.com/api/#description/introduction).

> ⚠️ The plugin is read-only and uses the Domotz Public API, so it needs an account with API access enabled.

## Setup

You will need a Domotz **API key** and to know which region your account is hosted in.

1. Sign in to the [Domotz Portal](https://portal.domotz.com).
2. Go to **Settings → Services → API Keys** and create an API key. The key inherits the permissions of the user that creates it, so create it with a user that can see every organization to monitor.
3. Paste the key into the **API key** field.
4. Choose the **Region**. Pick **North America** for accounts hosted in `us-east-1`, or **Rest of the World** for accounts hosted in `eu-west-1`. The API server listed in the Domotz Portal's API settings shows which one applies.

If SquaredUp reaches Domotz through an on-premises agent, allow outbound HTTPS (TCP 443) from that agent to `api-us-east-1-cell-1.domotz.com` or `api-eu-west-1-cell-1.domotz.com`, as described in the [Domotz firewall guide](https://help.domotz.com/tips-tricks/unblock-outgoing-connections-on-firewall/).

## Configuration fields

| Field | What it is | Where to find it | Required |
| ----- | ---------- | ---------------- | -------- |
| **Region** | The Domotz API server for the region the account is hosted in. | Domotz Portal → **Settings → Services → API Keys**, or the API server list in the Domotz API documentation. | Yes |
| **API key** | Authenticates every request via the `X-Api-Key` header. | Domotz Portal → **Settings → Services → API Keys**. | Yes |

On save, the plugin validates the key by fetching the current Domotz user; an invalid key, or a region that does not match the account, fails setup with an authentication error.

## What this plugin monitors

- **Collector health** — whether each on-site collector is connected, its licence, version and owning organization, plus connection lost and recovered events and uptime over a chosen period.
- **Devices** — every device a collector has discovered, with its current status, type, vendor and addresses, its up and down history, and uptime.
- **Alerts** — open and resolved alert events from Domotz alert rules, filterable by organization, collector, device, severity and status.
- **Network performance** — internet download and upload speed tests, and round trip latency and packet loss per device.
- **Service checks** — the up or down status of TCP port sensors configured on devices.

The out-of-the-box dashboards include a **Network Overview** across all collectors, plus a perspective for each **Collector** and **Device**.

To show a client's network next to their tickets, build the client's workspace scope from Collector objects filtered on the **Organization** property, then add the Domotz tiles beside the tiles from the client's service desk plugin.

## Data streams

- **Alerts** — alert events in the selected timeframe; account-wide, or filtered to selected organizations, collectors or devices.
- **Collectors** — every collector with status, licence, version and organization; account-wide.
- **Collector connectivity events** — connection lost and recovered events; per collector.
- **Collector uptime** — uptime percentage and online time; account-wide, or filtered to selected collectors.
- **Device latency** — baseline and latest round trip delay and packet loss for each device; per collector.
- **Device state history** — up, down, created and IP address change events; per device.
- **Device uptime** — uptime percentage for a device and its collector; per device.
- **Devices** — devices discovered by a collector; per collector.
- **Internet speed** — download and upload speed tests; per collector.
- **Organizations** — Domotz organizations and the collectors bound to them; account-wide.
- **TCP service checks** — TCP port sensors with current status; per collector.

## What gets indexed

| Object type | API source | Represents |
| ----------- | ---------- | ---------- |
| **Organization** | `GET /organization` | A Domotz organization, typically one MSP client. |
| **Collector** | `GET /agent` | The on-site Domotz collector monitoring a client network. |
| **Device** | `GET /agent/{id}/device` | A device discovered by a collector. |

**Relationships:** each Collector carries its organization id and name as properties, and each Device carries its collector id.

## Known limitations

- **Read-only** — the plugin never creates, changes or deletes anything in Domotz.
- **Device import runs one request per collector** — the Domotz API only lists devices per collector, so large estates use more of the API's daily request limit. A collector that fails to return devices is skipped without failing the rest of the import.
- **Collectors import in pages of 100** — very large accounts import over several requests.
- **Alerts timeframes** — alerts offer last 24 hours up to last 30 days, this month and last month. Alerts are filtered by organization, collector or device after they are fetched, so wide timeframes on large accounts return many rows.
- **Organization filtering** — Domotz alerts do not carry an organization, so the organization filter uses the collectors bound to that organization at the last import.
- **Uptime timeframes** — uptime streams offer last 24 hours up to last quarter. Downtime intervals are not shown.
- **Latency units** — Domotz does not document the unit of round trip delay values; they are displayed as milliseconds.
- **Point-in-time streams** — Devices, Device latency, TCP service checks and Collectors show current state and ignore the timeframe.
- **Data freshness** — organizations, collectors and devices are re-imported periodically, so newly added collectors or devices can take up to 12 hours to appear for scoping and drilldown.
