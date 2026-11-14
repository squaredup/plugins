Monitor the computers, clients, locations, network devices and tickets managed by [ConnectWise Automate](https://www.connectwise.com/platform/rmm/automate) in SquaredUp, using the Automate REST API.

> ⚠️ This plugin is built on the publicly documented behaviour of the Automate REST API and hasn't yet been verified against a production Automate server. If a data stream returns errors or empty columns on your server, please [raise an issue](https://github.com/squaredup/plugins/issues) with your Automate version so it can be fixed.

## Setup

You need an Automate **integrator** user and a ConnectWise **Client ID**.

1. Sign in to the Automate Control Center as an administrator.
2. Open **Integrator Login**, create an integrator user, and note its username and password. See ConnectWise's [Automate documentation](https://docs.connectwise.com/ConnectWise_Automate_Documentation) for where this lives in your version. Integrator users can sign in to the REST API without two-factor authentication, which the plugin can't complete. Ordinary users with two-factor authentication enabled will fail setup.
3. Get a Client ID from the [ConnectWise Developer Network](https://developer.connectwise.com/ClientID). Automate 2020 Patch 11 and later reject API requests without one.
4. In SquaredUp, enter the server's base address in **Server URL** (e.g. `https://yourcompany.hostedrmm.com`), then fill in **Username**, **Password** and **Client ID**.
5. For an on-premises Automate server that SquaredUp can't reach over the internet, run the data source on a SquaredUp agent installed on a machine that can reach the server.

## Configuration fields

| Field | What it is | Where to find it | Required |
| --- | --- | --- | --- |
| **Server URL** | The base address of the Automate server, without `/cwa/api/v1` or `/automate`. | The address used to sign in to the Automate web control center. | Yes |
| **Username** | The integrator username the plugin signs in with. | Automate Control Center → **Integrator Login**. | Yes |
| **Password** | The integrator user's password. | Set when creating the integrator user. | Yes |
| **Client ID** | Identifies the integration to ConnectWise. Sent with every request. | [ConnectWise Developer Network → Client ID](https://developer.connectwise.com/ClientID). | Yes |

On save, the plugin signs in and requests a single computer. A failure means the server couldn't be reached, the credentials or Client ID were rejected, or the user requires two-factor authentication.

## What this plugin monitors

- **Agent health**: which computers are online or offline, when each last checked in, and how long since contact.
- **Maintenance state**: computers that need a reboot, are in maintenance mode, or have old Windows updates or antivirus definitions.
- **Inventory**: operating system, type (server or workstation), agent version, IP address, domain and serial number for each computer, grouped by client and location.
- **Tickets**: Automate tickets with their status, priority and client, and the linked ConnectWise PSA ticket number when there is one.
- **Network devices**: devices discovered by Automate network probes, by client and location.

The out-of-the-box dashboards include an estate-wide **Overview**, plus a perspective for each **Client** and **Computer**.

## Data streams

- **Computers**: current state of each Automate agent. Account-wide by default, or filtered by client, location, computer or online status.
- **Tickets**: Automate tickets. Account-wide by default, or filtered by client and to open tickets only.
- **Network Devices**: network devices found by Automate probes. Account-wide by default, or filtered by client or location.

## What gets indexed

| Object type | API source | Represents |
| --- | --- | --- |
| **Client** | `GET /cwa/api/v1/clients` | A customer organization managed in Automate. |
| **Location** | `GET /cwa/api/v1/locations` | A site belonging to a client. |
| **Computer** | `GET /cwa/api/v1/computers` | A computer running the Automate agent. |
| **Network Device** | `GET /cwa/api/v1/networkdevices` | A device discovered by an Automate network probe. |

**Relationships:** each Location carries its client's ID and name. Each Computer and Network Device carries its client's and location's ID and name.

Objects are re-imported every 12 hours, so new computers appear on dashboards after the next import. The data streams always return live values.

## Known limitations

- **Not yet checked against a live Automate server.** Field names come from community documentation of the Automate REST API. The **Tickets** and **Network Devices** streams also show any extra fields the server returns, so data still appears if a field is named differently on your server. Please report anything missing or wrong.
- **Current state only.** The Automate REST API returns current values, not history, so the data streams have no timeframe.
- **Very large estates.** An account-wide **Computers** tile fetches every matching computer. In estates with tens of thousands of agents this can exceed SquaredUp's response size limit. Filter by client, location or status to keep results smaller.
- **Tickets can't be filtered by computer.** Filter by client instead.
- **Two-factor authentication isn't supported.** Use an integrator account. The plugin signs in and reuses its access token for up to 15 minutes before signing in again.
- **Uptime** is assumed to be reported in seconds.
- **Read-only.** The plugin never creates, changes or deletes anything in Automate.
