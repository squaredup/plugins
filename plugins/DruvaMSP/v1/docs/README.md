Monitor the customers and product tenants you manage in the [Druva Managed Services Center](https://www.druva.com/partners/msp) (MSC) in SquaredUp: tenant status and licensing, consumption, backup storage and endpoint alerts, via the [Druva MSP API](https://developer.druva.com/docs/getting-started-with-druva-msp-api-1).

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

- **Customers and tenants**: every customer you manage and each product tenant they hold, with provisioning status, edition, licence expiry and quota.
- **Consumption**: daily consumption units per customer, product module and service plan, for chargeback.
- **Backup storage**: Microsoft 365 storage and resource counts per workload, and Enterprise Workloads storage per backup set.
- **Alerts**: Endpoints alerts with their severity, the affected user or device, and when they first and last occurred.

The out-of-the-box dashboards include an MSP-wide **Overview** plus a perspective for each **Customer** and **Tenant**.

## Data streams

- **Customers**: your MSP customers with account details, provisioning status and cloud. Account-wide.
- **Tenants**: product tenants with status, edition, licence expiry and quota.
- **Consumption**: daily consumption units per customer, product module, entity and service plan.
- **Alerts**: Endpoints alerts with severity, affected entity, whether the alert is still active, and its occurrence window.
- **Microsoft 365 Storage Consumption**: backup storage, resource count and enabled resources per customer and workload.
- **Storage Consumption by Backup Set**: source size, changes, estimated cloud storage, storage tier and reduction factor per Enterprise Workloads backup set.

Every stream except **Customers** has an optional **Customer** picker. Leave it empty to see all customers, or pick one or more to narrow the results.

## What gets indexed

| Object type  | API source              | Represents                                                                                       |
| ------------ | ----------------------- | ------------------------------------------------------------------------------------------------ |
| **Customer** | `GET /msp/v3/customers` | A customer you manage in the Managed Services Center.                                            |
| **Tenant**   | `GET /msp/v3/tenants`   | One product subscription for a customer, such as Enterprise Workloads or SaaS Apps and Endpoints. |

**Relationships:** each Tenant links to the Customer that owns it.

## Known limitations

- **Consumption covers the last 7 days only**: a longer window returns more data than SquaredUp can load in one request, so longer ranges are not offered. Consumption tiles stay on 7 days even when you widen the dashboard timeframe.
- **Consumption mixes units**: the **Consumption** column holds both resource counts and terabytes. Filter or group on **Units** before you add values up, or the total is meaningless.
- **Alerts are Endpoints alerts only**: the Druva MSP API has no general alert or event feed, so alerts from other Druva products do not appear. The timeframe filters on when an alert was last updated.
- **Storage is a current snapshot**: the two storage streams show the latest values and ignore the dashboard timeframe. There is no storage history.
- **Report figures can lag**: Druva refreshes its reporting data periodically, so consumption, storage and alert figures can be an hour or two behind.
- **Some report rows have no matching customer**: Druva reports can include customers that are not in your current customer list. They appear in all-customer views but never on a **Customer** perspective.
- **The Tenant perspective is limited**: Druva reports its figures per customer, not per tenant, so the **Tenant** dashboard shows the tenant's status and details only.
- **Status shows health state**: status columns use SquaredUp's health colours and wording, so a suspended tenant shows as **Error** and a ready customer as **Success**.
- **Customers and tenants refresh every 12 hours**: a new customer or tenant appears after the next import.
- **Read-only**: the plugin never creates, changes or deletes anything in Druva.
