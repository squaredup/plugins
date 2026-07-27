# Before you start

This plugin connects to the **ConnectWise Manage** (ConnectWise PSA) REST API. You'll need:

- A ConnectWise Manage account with admin access, to create an API Member.
- Your **Company ID** — the identifier you use to log in to ConnectWise Manage.

## Creating an API Member and keys

1. Log in to ConnectWise Manage and go to **System > Members > API Members**.
2. Click **+** to create a new API Member, or select an existing one dedicated to integrations.
3. Give the API Member a **Security Role** with at least read access to: Companies, Service Tickets, Agreements, Configurations, Projects, Members, and Time Entries.
4. Open the API Member record, go to the **API Keys** tab, and click **+** to generate a new key pair.
5. Copy the **Public Key** and **Private Key** immediately — the Private Key is shown only once.

## Finding your Site URL

Your Site URL is the hostname of your ConnectWise Manage instance — for example `na.myconnectwise.net` for the default US cloud instance. If you're unsure, check the URL you use to log in to ConnectWise Manage in your browser and use that hostname (without `https://`).

## Configuration fields

| Field | Where to find it | Required |
|---|---|---|
| **Site URL** | Your ConnectWise Manage login hostname, e.g. `na.myconnectwise.net` | Yes |
| **Company ID** | Your ConnectWise Manage login identifier (System > My Account) | Yes |
| **API Public Key** | Generated on the API Member's API Keys tab | Yes |
| **API Private Key** | Generated alongside the Public Key — store it securely, it's shown only once | Yes |

## What gets indexed

- **ConnectWise Company** — client accounts
- **ConnectWise Agreement** — contracts/SLAs
- **ConnectWise Configuration** — managed assets/configuration items
- **ConnectWise Project** — projects
- **ConnectWise Member** — technicians/staff

Service tickets are **not** indexed as individual objects — MSPs can accumulate tens of thousands of tickets, and indexing each one as a graph object doesn't scale well. Ticket data is still fully available for dashboards and queries (open tickets by priority/board, tickets per company or agreement, hours logged per ticket), just not as individually searchable/scoped objects with their own perspective page.

## Known limitations

- This plugin covers service delivery and time tracking — sales (Opportunities), finance (Invoices), surveys, workflows, and procurement are not covered.
- ConnectWise Manage enforces rate limits per API Member; heavily-used API Members shared with other integrations may see throttling.
- The API Member's Security Role determines which records are visible — restricted roles (e.g. limited to specific boards or departments) will only surface a subset of data.
