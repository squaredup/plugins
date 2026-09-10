Monitor [Datto SaaS Protection](https://www.datto.com/products/saas-protection/) in SquaredUp — your protected customers, their Microsoft 365 and Google Workspace seats, and daily backup status per application — via the [Datto REST API for SaaS Protection](https://saasprotection.datto.com/help/M365/Content/Other_Administrative_Tasks/using-rest-api-saas-protection.htm).

> ⚠️ Requires a Datto Partner Portal account with **Admin** access to create an API key. The same key also reaches Datto's BCDR and Direct-to-Cloud endpoints, which this plugin does not use.

## Setup

You will need a Datto **public key** and **secret key**.

1. Sign in to the [Datto Partner Portal](https://portal.dattobackup.com) with an administrator account.
2. Go to **Admin → Integrations** and select the **API Keys** tab.
3. Click **Create API Key** and give it a name.
4. Copy the generated public key into the **Public Key** field, and the secret key into the **Secret Key** field. The secret is shown only once — if it is lost, regenerate the key pair.

## Configuration fields

| Field          | What it is                                                              | Where to find it                                            | Required |
| -------------- | ----------------------------------------------------------------------- | ----------------------------------------------------------- | -------- |
| **Public Key** | Sent as the username for HTTP Basic authentication on every request.    | Datto Partner Portal → **Admin → Integrations → API Keys**. | Yes      |
| **Secret Key** | Sent as the password. Encrypted at rest.                                | Datto Partner Portal → **Admin → Integrations → API Keys**. | Yes      |

On save, the plugin validates the key pair by listing your protected domains; an incorrect or revoked key fails setup with an authentication error.

## What this plugin monitors

<!-- finalized in Phase 9 -->

## Data streams

<!-- finalized in Phase 9 -->

## What gets indexed

<!-- finalized in Phase 9 -->

## Known limitations

- **`Storage Used` and `Total Storage Used (Account)` (on the Backups stream) are two different numbers, and only one of them is your Datto storage bill.** `Storage Used` is the per-application figure from Datto's applications report; summing it across a customer's applications will **not** match `Total Storage Used (Account)`, or the total shown in the Datto Partner Portal or on an invoice. Per [Datto's pricing model](https://saasprotection.datto.com/help/M365/Content/Administrator_requirements/02_Understanding_the_pricing_model.htm), billed storage is one figure per customer — "total stored size", computed after compression and deduplication — and, unlike the per-application figures, it [includes every retained historical backup version](https://help.one.kaseya.com/help-wip/Content/1_Configuration/saas-backup-storage-license.htm) (three backups a day for 30 days, then one a day for 90 days, then weekly for up to a year, then monthly beyond that), not just the current backup state. `Total Storage Used (Account)` is the API's own account-level total, consistently equal to or larger than the sum of the per-application figures — consistent with this billing definition — but Datto does not document what the field represents, so treat it as the best available estimate of the billed total rather than a confirmed match.
- **The Backups stream reaches back 30 days, so Last month is always partial.** The underlying `daysUntil` API parameter returns a `500 Internal Server Error` for any value above 30 — confirmed against the live API, not documented by Datto — and it only ever counts back from today, so no day older than that can be retrieved whichever timeframe is chosen. The stream offers Last 24 hours, Last 7 days, Last 30 days, This month and Last month; rows are trimmed to the selected window, and Last month raises a tile warning naming the date its coverage actually starts. Last quarter and Last year are not offered, as they would be empty for all but their final days. Note that `Backup Window` counts back from today, not from the start of the selected timeframe, so a Last month tile shows labels such as `29-30 days ago`; use `Window Start` and `Window End` for absolute dates.
- **The Seats stream's `Seat Type` filter requires comma-separated values, not repeated query parameters.** Confirmed against the live API: sending the filter as a repeated key (the usual REST convention for an array parameter) silently drops every value but the last, rather than returning an error — the plugin sends a single comma-joined value to avoid this.
