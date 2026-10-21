Monitor your [TANSS](https://www.tanss.de) service desk in SquaredUp: open tickets per company and technician, unassigned and overdue work, technician availability, and logged working time, via the [TANSS REST API](https://api-doc.tanss.de).

> ⚠️ TANSS is usually self-hosted. SquaredUp must be able to reach the TANSS backend over HTTPS, either because it is published to the internet or through an on-premise SquaredUp Relay Agent.

## Setup

You will need the address of your TANSS backend and a TANSS **API token**.

1. Sign in to TANSS as an administrator.
2. Go to **Settings > API** and create an API token for a technician or service account that can view tickets, technicians and timestamps. The plugin only reads data.
3. Copy the token and paste it into the **API token** field.
4. Enter the address of your TANSS backend in the **TANSS URL** field, including the `/backend` path, for example `https://tanss.example.com/backend`.

## Configuration fields

| Field | What it is | Where to find it | Required |
| ----- | ---------- | ---------------- | -------- |
| **TANSS URL** | The base address of the TANSS backend, without a trailing slash. | The address used by TANSS clients, followed by `/backend`. | Yes |
| **API token** | Authenticates every request via the `apiToken` header. | TANSS **Settings > API**. | Yes |

On save, the plugin checks the connection by listing technicians and then checks it can read tickets. A connection failure usually means the URL is missing the `/backend` path or the token is invalid.

## What this plugin monitors

- **Ticket backlog**: open tickets assigned to technicians, unassigned tickets, repair, unidentified and project tickets, with status, company, age and deadline.
- **Technician workload**: tickets per technician, current availability, and working, pause and overtime totals.
- **Time tracking**: clock-in, clock-out and pause events recorded by technicians.

The out-of-the-box dashboards include an **Overview**, plus **Technician Workload** and **Company Tickets** perspectives.

## Data streams

- **Tickets**: tickets from one of the TANSS ticket lists, optionally filtered to companies or technicians (account-wide).
- **Technicians**: all technicians (account-wide).
- **Timestamps**: time tracking events in the selected period, optionally filtered to technicians (account-wide).
- **Time Statistics**: working time totals for the selected period (per technician).
- **Technician Availability**: current availability (per technician).

## What gets indexed

| Object type | API source | Represents |
| ----------- | ---------- | ---------- |
| **Technician** | `GET /api/v1/employees/technicians` | A TANSS technician. |
| **Company** | `GET /api/v1/tickets/technician` | A customer company with at least one open ticket assigned to a technician. |

**Relationships:** tickets link to their company and assigned technician.

## Known limitations

- **Companies come from tickets**: the TANSS API has no read-only list of all companies, so only companies with open tickets assigned to a technician are indexed.
- **Devices are not included**: the TANSS API has no endpoint for listing PCs or peripherals.
- **No ticket search**: TANSS ticket search uses request types the plugin cannot send, so tickets come from the fixed TANSS ticket lists.
- **Monitoring, ERP and phone data** need role-specific TANSS tokens and are not included.
- **Untested preview**: this plugin was built from the TANSS API reference and has not yet been verified against a live TANSS instance.
- **Read-only**: the plugin never creates, modifies or deletes anything in TANSS.
