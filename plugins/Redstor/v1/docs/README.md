Monitor a [Redstor](https://www.redstor.com) Partner account in SquaredUp. Customer companies, seat and storage consumption, backup and restore health, and product subscriptions all via the [RedAPI](https://www.redstor.com/our-technology/integrations/redapi/).

## Setup

You will need a RedAPI **service account** with its Client ID and private key, plus the Partner company's ID.

> ⚠️ RedAPI is only available to **Partner Admin** users on current Redstor pricing plans. Company Admins and legacy-plan accounts cannot use it. This data source does not cover Redstor's older Storage Platform REST API.

1. Sign in to [RedApp](https://redapp.redstor.com) as a **Partner Admin**.
2. Note the Partner company's ID (found under **Company Settings**) and paste it into the **Company ID** field.
3. Go to **RedAPI > Service accounts** and click to add a new service account. Give it a descriptive name and assign it access to the Partner company (and the customers to monitor).
4. Under the service account, create a **key**. Redstor generates a Client ID and a JSON Web Key (JWK) file. Download the JWK file.
5. Copy the **Client ID** into the **Client ID** field.
6. Open the downloaded JWK file (a `.json` file) and paste its full contents, exactly as downloaded, into the **Private key** field.

## Configuration fields

| Field | What it is | Where to find it | Required |
| ----- | ---------- | ---------------- | -------- |
<<<<<<< HEAD
| **Company ID** | The Redstor Partner company's ID. Scopes every API call to this company and its direct customers. | RedApp > **Company Settings**. | Yes |
| **Client ID** | Identifies the RedAPI service account used to authenticate. | RedApp > **RedAPI > Service accounts** > the service account's key. | Yes |
=======
| **Company ID** | Your Redstor company's ID. You can find this in the Redstor application | RedApp → **Company Settings**. | Yes |
| **Client ID** | Identifies the RedAPI service account used to authenticate. | RedApp → **RedAPI → Service accounts** → your service account's key. | Yes |
>>>>>>> 597e93a (Reword Company ID description in Redstor README)
| **Private key** | The JSON Web Key (JWK) paired with the Client ID; signs the request used to obtain access tokens. | Downloaded when the service account's key was created. | Yes |

On save, the data source authenticates and calls the configured company's profile; an invalid Company ID, Client ID, or Private key fails setup with an authentication error.

## What this data source contains

- **Customer companies**: the Partner company and the customers beneath it.
- **Seat usage and billing exposure**: active, inactive and shared seats, licensed users, data protected and fair use overage, broken down by product for each company.
- **Backup and restore health**: succeeded, warning, failed and missed counts by product, plus the latest run for every individual backup account.
- **Backup accounts**: every protected mailbox, drive, site and machine, with the product and service it belongs to.
- **Subscriptions**: which products each company is subscribed to, and whether each is on trial.

## Data streams

**Estate streams: for summarising activity across the whole Partner account (no company selection needed)**

- **Estate Backup Summary**: backup results by product, split into the Partner company's own totals and a rollup across every customer beneath it.
- **Estate Restore Summary**: restore results by product, split the same way.
- **Estate Consumption**: seat counts, licensed users and data protected, split the same way.
- **Partner Subscriptions**: which products the Partner company itself is subscribed to. Redstor has no equivalent "across all customers" endpoint for subscriptions, so this covers the Partner company only.

**Company streams: for summarising activity across one company, picked via a scope or dashboard variable**

- **Company Backup Summary**: backup results by product for a company, counting succeeded, warnings, errors, failures and missed runs.
- **Company Restore Summary**: restore results by product for a company.
- **Company Backups**: backup run history for every account in a company.
- **Company Restores**: the current restore status for every account in a company.
- **Company Accounts**: every backup account in a company, one row per account, with its product, service, storage region and creation date.
- **Company Consumption**: seat counts, licensed users, data protected and fair use overage by product, for a company.
- **Company Subscriptions**: which products a company is subscribed to, and whether each is on trial.

**Account streams: for tracking down an individual account's history and errors**

- **Account Backups**: backup run history for a single account, over Redstor's rolling seven day window.
- **Account Restores**: the current restore status for a single account.
- **Account Backup Errors**: backup error and warning messages for a single account.
- **Account Restore Errors**: restore error and warning messages for a single account.

## What gets indexed

| Object type | API source | Represents |
| ----------- | ---------- | ---------- |
| **Company** | `GET /companies/{companyId}`, `GET /companies/{companyId}/customers` | The configured Partner company and its direct customer companies. |
| **Account** | `GET /storage/accounts` | A single backup account: one mailbox, drive, site or machine. Not the same as a seat, as described above. |
| **Product** | `GET /products` | A product a company can subscribe to and be billed for, such as O365 or Machines. |
| **Service** | `GET /products` | A workload within a product, such as Exchange, OneDrive, SharePoint or Teams within O365. |
| **Edition** | `GET /products` | An edition of a product, such as Premium. |

## Notes

- **Accounts that have never run a backup have no error detail**: Redstor only keeps error messages for accounts that have backup history. The Account Backup Errors and Account Restore Errors streams say so rather than returning rows. In testing this applied to roughly a third of a company's accounts.
- **No groups or collections**: Redstor's grouping features are not available through the API and cannot be reported on.
- **Only direct customers are included**: the Partner company and the customers directly beneath it are indexed; deeper reseller-of-reseller chains are not followed. Raise an issue if you require this extra level of detail.
- **Subject to Redstor's fair use throttling**: RedAPI is rate limited and the limits are not published, so very large estates may import slowly.
- **Read-only**: the data source never creates, modifies, or deletes anything in Redstor.
