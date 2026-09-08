Monitor your [Redstor](https://www.redstor.com) Partner account in SquaredUp — customer companies, seat and storage consumption, backup and restore health, and product subscriptions — via the [RedAPI](https://www.redstor.com/our-technology/integrations/redapi/).

> ⚠️ RedAPI is only available to **Partner Admin** users on current Redstor pricing plans — Company Admins and legacy-plan accounts cannot use it. This plugin does not cover Redstor's older Storage Platform REST API.

## Setup

You will need a RedAPI **service account** with its Client ID and private key, plus your Partner company's ID.

1. Sign in to [RedApp](https://redapp.redstor.com) as a **Partner Admin**.
2. Note your Partner company's ID — find it under **Company Settings** — and paste it into the **Company ID** field.
3. Go to **RedAPI → Service accounts** and click to add a new service account. Give it a descriptive name and assign it access to your Partner company (and the customers you want visibility into).
4. Under the service account, create a **key**. Redstor generates a Client ID and a JSON Web Key (JWK) file — download the JWK file.
5. Copy the **Client ID** into the **Client ID** field.
6. Open the downloaded JWK file (a `.json` file) and paste its full contents, exactly as downloaded, into the **Private Key** field.

## Configuration fields

| Field | What it is | Where to find it | Required |
| ----- | ---------- | ---------------- | -------- |
| **Company ID** | Your Redstor Partner company's ID. Scopes every API call to this company and its direct customers. | RedApp → **Company Settings**. | Yes |
| **Client ID** | Identifies the RedAPI service account used to authenticate. | RedApp → **RedAPI → Service accounts** → your service account's key. | Yes |
| **Private Key** | The JSON Web Key (JWK) paired with the Client ID; signs the request used to obtain access tokens. | Downloaded when the service account's key was created. | Yes |

On save, the plugin authenticates and calls your company's profile; an invalid Company ID, Client ID, or Private Key fails setup with an authentication error.

## What this plugin monitors

- **Customer companies** — your Partner company and the customers beneath it.
- **Seat usage and billing exposure** — active, inactive and shared seats, licensed users, data protected and fair use overage, broken down by product for each company.
- **Backup and restore health** — succeeded, warning, failed and missed counts by product, plus the latest run for every individual backup account.
- **Backup accounts** — every protected mailbox, drive, site and machine, with the product and service it belongs to.
- **Subscriptions** — which products each company is subscribed to, and whether each is on trial.

**Seats and accounts are not the same number.** Redstor bills per seat, where a seat is one person. A single seat usually holds several backup accounts: a Microsoft 365 seat is an Exchange account plus a OneDrive account, and SharePoint and Teams sites add more on top. A company's account count will therefore be considerably higher than its seat count, so take seat figures from **Company Consumption** rather than by counting accounts.

The out-of-the-box dashboards include a Company **Overview** and a perspective for each **Account**.

## Data streams

- **Company Consumption** — seat counts, licensed users, data protected and fair use overage by product, for a company.
- **Company Subscriptions** — product subscriptions for a company, with the product and edition named and the trial status shown.
- **Company Backup Status** — backup results by product for a company, counting succeeded, warnings, errors, failures and missed runs.
- **Company Restore Status** — restore results by product for a company.
- **Company Account Backup Status** — the latest backup run for every account in a company, with an option to return the full history Redstor holds.
- **Company Account Restore Status** — the latest restore state for every account in a company.
- **Backup Accounts** — every backup account in a company, one row per account, with its product, service, storage region and creation date.
- **Account Backup Errors** — backup error and warning messages for a single account.
- **Account Restore Errors** — restore error and warning messages for a single account.
- **Products** — the Redstor product catalog.
- **Product Services** — the services within each product, such as Exchange and OneDrive within O365.
- **Product Editions** — the editions available for each product, and which of them offer a trial.

## What gets indexed

| Object type | API source | Represents |
| ----------- | ---------- | ---------- |
| **Company** | `GET /companies/{companyId}`, `GET /companies/{companyId}/customers` | Your configured Partner company and its direct customer companies. |
| **Account** | `GET /storage/accounts` | A single backup account: one mailbox, drive, site or machine. Not the same as a seat, as described above. |
| **Product** | `GET /products` | A product a company can subscribe to and be billed for, such as O365 or Machines. |
| **Service** | `GET /products` | A workload within a product, such as Exchange, OneDrive, SharePoint or Teams within O365. |
| **Edition** | `GET /products` | An edition of a product, such as Premium. |

**Relationships:** each Account belongs to its parent Company.

Seats are not indexed as objects, because Redstor reports them as counts rather than as individually addressable records. They appear in **Company Consumption**.

## Known limitations

- **No historical data** — every stream reports the current state, as RedAPI exposes no time ranges, so tiles have no timeframe selection. Consumption is the one partial exception: it can report a single past date, but not a range or a trend.
- **Backup history is limited and can be large** — Company Account Backup Status shows the latest run per account by default. Enabling **Include full history** returns every run in Redstor's rolling seven day window, which on a large customer can be more data than a single tile can return.
- **Accounts that have never run a backup have no error detail** — Redstor only keeps error messages for accounts that have backup history. The Account Backup Errors and Account Restore Errors streams say so rather than returning rows. In testing this applied to roughly a third of a company's accounts.
- **Machine products report workloads, not seats** — Machines and Azure Virtual Machines return zero for every seat count and are measured by workload count instead, so seat-based tiles will look empty for those products.
- **No billable seat total** — Redstor reports active, inactive and shared seats separately but publishes no chargeable figure, so billing has to be worked out from your own agreement and Redstor's fair use rules rather than read directly.
- **Restore status codes are not documented** — Redstor publishes no meaning for the numeric restore status values, so they appear as a raw number rather than a health colour. Backup status codes are documented and do show as colours. On a company with no restore activity, the stream lists accounts with no status against them.
- **No groups or collections** — Redstor's grouping features are not available through the API and cannot be reported on.
- **Only direct customers are included** — your Partner company and the customers directly beneath it are indexed; deeper reseller-of-reseller chains are not followed.
- **Subject to Redstor's fair use throttling** — RedAPI is rate limited and the limits are not published, so very large estates may import slowly.
- **Read-only** — the plugin never creates, modifies, or deletes anything in Redstor.
