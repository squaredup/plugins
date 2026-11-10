Monitor your [Spacelift](https://spacelift.io) stacks, runs, drift and worker pool capacity in SquaredUp, using the [Spacelift GraphQL API](https://docs.spacelift.io/integrations/api).

> ⚠️ Spacelift counts every API key used during a billing cycle as a user, so this data source takes one seat on your Spacelift plan.

## Setup

You need a secret-based Spacelift **API key**. Creating one needs a Spacelift admin.

1. Sign in to Spacelift at your account address, for example `https://myaccount.app.spacelift.io`.
2. Go to **Organization settings > API keys** and create a new key. Choose a **secret** key, not an OIDC key.
3. Give the key the **Reader** role on the spaces you want to monitor. Reader on the **root** space covers every space, and is also needed for the billing usage data. See [Assigning roles to API keys](https://docs.spacelift.io/concepts/authorization/assigning-roles-api-keys).
4. Save the key. Copy its **ID** and **secret**. The secret is shown only once, and is also in the file Spacelift downloads when the key is created.
5. In SquaredUp, enter your account address in **Account URL**, and the key's ID and secret in **API key ID** and **API key secret**.

## Configuration fields

| Field | What it is | Where to find it | Required |
| --- | --- | --- | --- |
| **Account URL** | The address of your Spacelift account. Requests go to its `/graphql` endpoint. | The address in your browser when you're signed in to Spacelift, without any path, e.g. `https://myaccount.app.spacelift.io`. For self-hosted Spacelift, your server's address. | Yes |
| **API key ID** | The ID of a secret-based Spacelift API key. | Spacelift **Organization settings > API keys**. | Yes |
| **API key secret** | The secret for that API key. It's exchanged for a short-lived token, which is renewed before it expires. | Shown once when the key is created, and in the file Spacelift downloads at that point. | Yes |

When you save, the data source signs in with the key, then checks it can see stacks and read billing usage. If sign-in fails, check the account URL and the key. If only the later checks fail, the key's roles don't cover every space or the root space.

## What this plugin monitors

- **Stack health**: each stack's current state, with failed stacks, stacks awaiting confirmation, drifted stacks, locked stacks and disabled stacks called out.
- **Runs**: runs and tasks across the account or on one stack, with their outcome, duration, who triggered them and the resources each one added, changed or deleted.
- **Delivery performance**: daily deployments, change failure rate, lead time for changes and time to recovery, as calculated by Spacelift.
- **Capacity**: busy, idle and drained workers and queued runs for each worker pool, including the public pool, plus run minutes and seats used in the current billing period.

The out-of-the-box dashboards include a **Spacelift Overview**, plus a perspective for each **Stack** and **Worker Pool**.

## Data streams

- **Stacks**: the current state, health, drift and lock status of each stack. Account-wide, or filtered to selected stacks or worker pools.
- **Runs**: runs and tasks started across all stacks in the selected timeframe, up to the last 7 days. Module test runs are excluded.
- **Stack Runs**: runs and tasks started on the selected stack, up to the last 7 days.
- **Worker Pools**: workers, utilization and queued runs for each worker pool, including the public pool. Account-wide, or filtered to selected pools.
- **Workers**: each worker registered in the selected private worker pool, with its status.
- **Delivery Metrics**: one row per day with deployments, change failure rate, and average and median lead time and time to recovery. Account-wide.
- **Account Usage**: run minutes, seats and self-hosted workers used in the current billing period. Account-wide.

## What gets indexed

| Object type | API source | Represents |
| --- | --- | --- |
| **Stack** | GraphQL `stacks` | A Spacelift stack, with its space, vendor (Terraform, OpenTofu, Pulumi and so on), repository, branch and labels. |
| **Worker Pool** | GraphQL `workerPools` and `publicWorkerPool` | A private worker pool, or the public worker pool (on Spacelift's hosted service). |

Each stack's **Worker pool** links to the Worker Pool it runs on. Stacks with no pool of their own link to the public worker pool.

## Known limitations

- **Billable seat**: Spacelift counts every API key used during a billing cycle as a user, so this data source uses one seat.
- **Secret-based keys only**: OIDC-based API keys aren't supported.
- **Run history is capped at 7 days**: Spacelift returns at most 8 days of runs for a stack, so both run streams offer timeframes up to the last 7 days. For longer trends, use **Delivery Metrics**.
- **Busy accounts**: account-wide runs are read 50 at a time, so a week of runs in a very busy account takes longer to load than a shorter timeframe.
- **Delivery Metrics are daily**: timeframes start at the last 7 days, and days are counted in UTC.
- **Very large accounts**: the stack list is read in a single request. An account with several thousand stacks may exceed the size SquaredUp can process in one response.
- **Usage needs the root space**: **Account Usage** needs the key to have read access to the root space. Without it, that stream shows an error and everything else still works.
- **Drift needs drift detection**: a stack is only marked as drifted after a [drift detection](https://docs.spacelift.io/concepts/stack/drift-detection) run finds a difference, so set up drift detection on the stacks you care about.
- **Workers in the public pool aren't listed**: Spacelift only reports the public pool's capacity, not its individual workers.
- **Object list refresh**: new stacks and worker pools appear in SquaredUp after the next import, which runs every 12 hours. States, runs and capacity are always read live.
