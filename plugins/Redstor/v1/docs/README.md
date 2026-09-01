Monitor your [Redstor](https://www.redstor.com) Partner account in SquaredUp — customer companies, backup accounts, backup and restore status, storage consumption, and product subscriptions — via the [RedAPI](https://www.redstor.com/our-technology/integrations/redapi/).

> ⚠️ RedAPI is only available to **Partner Admin** users on current Redstor pricing plans — Company Admins and legacy-plan accounts cannot use it. This plugin does not cover Redstor's older Storage Platform REST API.

## Setup

You will need a RedAPI **service account** with its Client ID and private key, plus your Partner company's ID.

1. Sign in to [RedApp](https://redapp.redstor.com) as a **Partner Admin**.
2. Note your Partner company's ID — find it under **Company Settings** — and paste it into the **Company ID** field.
3. Go to **RedAPI → Service accounts** and click to add a new service account. Give it a descriptive name and assign it access to your Partner company (and the customers you want visibility into).
4. Under the service account, create a **key**. Redstor generates a Client ID and a private/public key pair — download the private key file.
5. Copy the **Client ID** into the **Client ID** field.
6. Open the downloaded private key file and paste its full contents — including the `-----BEGIN PRIVATE KEY-----` / `-----END PRIVATE KEY-----` lines — into the **Private Key** field.

## Configuration fields

| Field | What it is | Where to find it | Required |
| ----- | ---------- | ---------------- | -------- |
| **Company ID** | Your Redstor Partner company's ID. Scopes every API call to this company and its direct customers. | RedApp → **Company Settings**. | Yes |
| **Client ID** | Identifies the RedAPI service account used to authenticate. | RedApp → **RedAPI → Service accounts** → your service account's key. | Yes |
| **Private Key** | The PEM-encoded private key paired with the Client ID; signs the client assertion used to obtain access tokens. | Downloaded when the service account's key was created. | Yes |

On save, the plugin authenticates by exchanging a signed JWT for a Redstor access token and calling your company's profile; an invalid Company ID, Client ID, or Private Key fails setup with an authentication error.

## What this plugin monitors

- **Companies** — your Partner account and its customer companies.
- **Accounts** — backup and storage accounts, one per product/service a company runs.
- **Backup & restore status** — succeeded/failed/missed counts by product, plus recent per-account run history.
- **Consumption & subscriptions** — storage and seat usage, and active product subscriptions, per company.
- **Account errors** — backup and restore error and warning messages for a specific account.

The out-of-the-box dashboards include a Partner-wide **Overview** plus a perspective for each **Company** and **Account**.

## Data streams

- **Company Accounts** — backup/storage accounts for a company, one row per account.
- **Company Backup Status** — current backup status by product for a company.
- **Company Restore Status** — current restore status by product for a company.
- **Company Consumption** — storage and seat consumption by product for a company.
- **Company Subscriptions** — product subscriptions for a company.
- **Company Account Backup Status** — recent backup run history per account for a company.
- **Company Account Restore Status** — current restore status per account for a company.
- **Account Backup Errors** — backup error and warning messages for an account.
- **Account Restore Errors** — restore error and warning messages for an account.

## What gets indexed

| Object type | API source | Represents |
| ----------- | ---------- | ---------- |
| **Redstor Company** | `GET /companies/{companyId}`, `GET /companies/{companyId}/customers` | Your configured Partner company and its direct customer companies. |
| **Redstor Account** | `GET /storage/accounts` | A backup or storage account belonging to a company, for one product/service. |

**Relationships:** each Account belongs to its parent Company.

## Known limitations

- **Entirely unverified against a live Redstor tenant** — this plugin was authored directly from Redstor's public RedAPI OpenAPI specification, with no Redstor Partner Admin credentials available to test authentication or any data stream against a real account. Verify against a live tenant before relying on it in production.
- **No historical or time-range data** — RedAPI exposes no `from`/`to` range parameter on any endpoint; every stream returns a current-state snapshot, and dashboards have no timeframe picker.
- **Backup/restore status codes are undocumented** — the numeric `status` values in Company Account Backup/Restore Status aren't defined anywhere in RedAPI's public documentation, so they're shown as raw numbers rather than mapped to a health color.
- **Subscriptions show IDs, not names** — RedAPI's `/subscriptions` endpoint returns `productId`/`editionId` only, with no product name lookup; this plugin doesn't index a Products type, so subscription rows show numeric IDs.
- **Company hierarchy is one level deep** — only the configured Partner company and its direct customers are indexed; deeper reseller-of-reseller chains aren't walked recursively.
- **Private key format assumed PEM** — the exact format RedApp downloads for a RedAPI service account key couldn't be confirmed without live access; PEM is assumed based on standard `private_key_jwt` practice.
- **Subject to Redstor's fair-use throttling** — RedAPI enforces rate limiting; specific limits aren't published.
- **Read-only** — the plugin never creates, modifies, or deletes anything in Redstor.
