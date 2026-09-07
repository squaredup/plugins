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

<!-- finalized in Phase 9 -->
