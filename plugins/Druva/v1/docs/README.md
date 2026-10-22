Monitor the customers and product tenants you manage in the [Druva Managed Services Center](https://www.druva.com/partners/msp) (MSC) in SquaredUp: tenant status and licensing, consumption, backup activity and alerts, via the [Druva MSP API](https://developer.druva.com/docs/getting-started-with-druva-msp-api-1).

> ⚠️ This plugin uses the **MSP** API, so it needs credentials created in the Managed Services Center. API credentials created inside a single customer's Druva Cloud Platform console will not work.

## Setup

You will need a Druva MSP API **Client ID** and **Secret key**.

1. Sign in to the [Druva Managed Services Center](https://login.druva.com) as an MSP administrator.
2. Open the **API Credentials** page and create new credentials, following [Integration with Druva MSP APIs](https://help.druva.com/en/articles/8805729-integration-with-druva-msp-apis).
3. Copy the **Client ID** and **Secret Key**. The secret key is only shown once.
4. Paste them into the **Client ID** and **Secret key** fields below.

MSP API credentials have access to all MSP API scopes. The plugin only ever reads data.

## Configuration fields

| Field          | What it is                                                                               | Where to find it                                         | Required |
| -------------- | ---------------------------------------------------------------------------------------- | -------------------------------------------------------- | -------- |
| **Client ID**  | Identifies the MSP API credentials. Exchanged with the secret key for an access token.   | Managed Services Center → **API Credentials**            | Yes      |
| **Secret key** | The secret paired with the client ID.                                                    | Shown once when the API credentials are created          | Yes      |

On save, the plugin requests an access token and lists your first MSP customer. A failure means the client ID or secret key is wrong, has been revoked, or was not created in the Managed Services Center.

## What this plugin monitors

<!-- finalized in Phase 9 -->

## Data streams

<!-- finalized in Phase 9 -->

## What gets indexed

<!-- finalized in Phase 9 -->

## Known limitations

<!-- finalized in Phase 9 -->
