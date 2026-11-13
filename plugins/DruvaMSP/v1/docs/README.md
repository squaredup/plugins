Monitor the customers and product tenants you manage in the [Druva Managed Services Center](https://www.druva.com/partners/msp) (MSC) in SquaredUp: backup activity and protection risk, tenant status and licensing, consumption, backup storage and endpoint alerts, via the [Druva MSP API](https://developer.druva.com/docs/getting-started-with-druva-msp-api-1).

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

- **Backup jobs**: every Enterprise Workloads backup job, with its outcome (successful, failed, skipped, window expired), timing and the backup set and VM it covered.
- **Backup risk**: the last backup of every Microsoft 365 user and endpoint device, flagged **At risk** when it failed, never ran, or is older than the threshold you set.
- **Customers and tenants**: every customer you manage and each product tenant they hold, with its type (sandbox, evaluation or commercial), provisioning status, edition, licence expiry and quota.
- **Consumption**: daily consumption units per customer, product module and service plan, for chargeback.
- **Backup storage**: Microsoft 365 storage and resource counts per workload, and Enterprise Workloads storage per backup set.
- **Endpoint alerts**: alerts with their severity, the affected user or device, and when they first and last occurred.

The out-of-the-box dashboards are **Backup Health** and **Account Usage** across all customers, plus **Backup Health** and **Usage** perspectives for each customer.

## Data streams

- **Backup Jobs**: Enterprise Workloads backup jobs with status, start and end times, duration, backup set, VM, workload and policy.
- **Microsoft 365 Backup Status**: the last backup of each Microsoft 365 user per workload, with its status, age and an at-risk state.
- **Endpoint Backup Status**: the last backup of each endpoint device, with its status, age, connectivity and an at-risk state.
- **Customers**: your MSP customers with account details, provisioning status and cloud. Account-wide.
- **Tenants**: product tenants with type, status, edition, licence expiry and quota.
- **Consumption**: daily consumption units per customer, product module, entity and service plan.
- **Endpoint Alerts**: endpoint alerts with severity, affected entity, whether the alert is still active, and its occurrence window.
- **Microsoft 365 Storage Consumption**: backup storage, resource count and enabled resources per customer and workload.
- **Storage Consumption by Backup Set**: source size, changes, estimated cloud storage, storage tier and reduction factor per Enterprise Workloads backup set.

Every stream except **Customers** has an optional **Customer** picker. Leave it empty to see all customers, or pick one or more to narrow the results. The two backup status streams also have a **Stale after (hours)** threshold, 24 by default, beyond which a last backup counts as at risk.

## What gets indexed

| Object type  | API source              | Represents                                                                                       |
| ------------ | ----------------------- | ------------------------------------------------------------------------------------------------ |
| **Customer** | `GET /msp/v3/customers` | A customer you manage in the Managed Services Center.                                            |

## Known limitations

- **Consumption covers the last 7 days only**: a longer window returns more data than SquaredUp can load in one request, so longer ranges are not offered. Consumption tiles stay on 7 days even when you widen the dashboard timeframe.
- **Consumption mixes units**: the **Consumption** column holds both resource counts and terabytes. Filter or group on **Units** before you add values up, or the total is meaningless.
- **Only endpoint alerts are available**: the Druva MSP API has no general alert or event feed, so alerts from other Druva products do not appear. The timeframe filters on when an alert was last updated.
- **Storage is a current snapshot**: the two storage streams show the latest values and ignore the dashboard timeframe. There is no storage history.
- **Report figures can lag**: Druva refreshes its reporting data periodically, so backup, consumption, storage and alert figures can be an hour or two behind.
- **Some report rows have no matching customer**: Druva reports can include customers that are not in your current customer list. They appear in all-customer views but never on a **Customer** perspective.
- **Tenants are data, not objects**: tenant details appear in the **Tenants** stream and on each customer's **Usage** dashboard, but tenants are not imported, so they cannot be searched for, picked as a dashboard variable or drilled into. Druva reports backup figures per customer, so backup views filter by customer.
- **Backup jobs show only jobs that ran**: a backup set with no job in the selected window does not appear at all, so a backup set that has stopped running entirely will not show as failed.
- **Large estates may need a shorter backup jobs window**: 30 days of jobs from a large MSP can be more than SquaredUp loads in one request and return incomplete results. Use 7 days or 24 hours if totals look low.
- **Failed backups show the attempt, not the last success**: for a failed backup the time shown is the failed attempt, because Druva does not report when the last successful backup was.
- **Microsoft 365 backup status covers Exchange Online and OneDrive**: other Microsoft 365 workloads are not included.
- **Deleted users and devices are left out** of the backup status streams, since they are no longer a backup risk.
- **Status shows health state**: status columns use SquaredUp's health colours and wording, so a suspended tenant shows as **Error** and a ready customer as **Success**.
- **Customers refresh every 12 hours**: a new customer appears after the next import. Tenant details are read live.
- **Read-only**: the plugin never creates, changes or deletes anything in Druva.
