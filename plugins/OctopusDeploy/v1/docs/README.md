Monitor your [Octopus Deploy](https://octopus.com) spaces in SquaredUp, including what is deployed where, deployment and runbook history, the task queue and deployment target health. Data comes from the [Octopus REST API](https://octopus.com/docs/api). Works with both Octopus Cloud and self-hosted Octopus Server.

## Setup

You will need the address of your Octopus server and an **API key**. Using a dedicated read-only service account is recommended, because the plugin only ever reads from Octopus.

1. Sign in to Octopus Deploy as an administrator.
2. Create a service account. Go to **Configuration → Users**, click **Add User**, tick **The user is a service account**, and save. See [Service accounts](https://octopus.com/docs/security/users-and-teams/service-accounts).
3. Give the account read access. Go to **Configuration → Teams**, create or choose a team, add the service account, and include the **Project viewer** and **Environment viewer** roles for every space to monitor. See [User roles](https://octopus.com/docs/security/users-and-teams/user-roles).
4. Create an API key for the account. Open the service account under **Configuration → Users**, click **New API Key**, give it a purpose such as `SquaredUp`, and copy the key. It starts with `API-`. See [How to create an API key](https://octopus.com/docs/api/authentication/create-an-api-key).
5. In SquaredUp, enter the **Server URL** and paste the key into **API key**.

## Configuration fields

| Field | What it is | Where to find it | Required |
| ----- | ---------- | ---------------- | -------- |
| **Server URL** | The address of your Octopus server, e.g. `https://example.octopus.app` for Octopus Cloud or `https://octopus.example.com` for a self-hosted server. | The address in your browser's address bar when you open Octopus. | Yes |
| **API key** | The key used to authenticate every request. It is sent in the `X-Octopus-ApiKey` header. | Octopus → **Configuration → Users** → the service account → **API Keys**, or **Profile → My API Keys** for your own user. | Yes |

When you save, the plugin checks the key by fetching the user it belongs to. If the server URL is unreachable, or the key is invalid or expired, setup fails with an authentication error. For a self-hosted server that uses a certificate from an internal certificate authority, turn on **Ignore certificate errors**.

## What this plugin monitors

- **Current deployment status**: the release deployed to each environment (and tenant) for every project, whether it succeeded, and whether it is waiting on manual intervention.
- **Deployment history**: every deployment with its outcome, duration and who deployed it, for tracking deployment frequency, success rate and failures.
- **Task queue and history**: queued and running tasks, plus recent runbook runs, health checks and other server tasks.
- **Deployment target health**: the health status of every deployment target, with its target tags, environments and operating system.
- **Workers and agents**: worker health in each worker pool, and which Tentacle and Calamari agents need upgrading.
- **Approvals and freezes**: deployments and runbook runs waiting on a manual intervention or guided failure, and deployment freezes in force now or coming up.
- **Runbooks**: the latest run of each runbook in each environment, and run history.
- **Certificates**: certificates in the Octopus library, and how soon they expire.
- **Audit log**: who changed or did what, and when.

The out-of-the-box dashboards include **Overview**, **Tasks**, **Infrastructure** and **Audit** dashboards, plus a perspective for each **Project**, **Environment**, **Deployment Target**, **Runbook** and **Worker Pool**.

## Data streams

Each stream can be scoped to whole **Spaces**, or to individual projects, environments, tenants or deployment targets to see just that object's data.

- **Deployment Status**: the latest deployment of each project to each environment and tenant, with release version and status.
- **Release Progression**: the latest releases of one project, with a row for each release and environment showing whether it was deployed there, when, and where it is ready to deploy next, like the Octopus **Project Dashboard**.
- **Deployments**: deployment history for the timeframe, one row per deployment, with project, environment, tenant, channel, release, outcome, deployed by and duration.
- **Tasks**: server tasks in the timeframe, filterable by task type (deployment, runbook run, health check, and so on), state and project. With a timeframe of **None**, it returns only queued and running tasks.
- **Deployment Targets**: deployment targets with their current health, target tags, environments, communication style and agent versions.
- **Workers**: workers with their current health, worker pools and agent versions.
- **Runbook Status**: the latest run of one runbook in each environment, like the Octopus runbook overview.
- **Pending Interventions**: deployments and runbook runs waiting on a manual intervention or guided failure, with how long they have waited.
- **Deployment Freezes**: freezes that are active now or scheduled, with what they block.
- **Certificates**: certificates in the Octopus library, with days until expiry.
- **Audit Events**: the Octopus audit log, filterable by category, for up to the last 7 days.

## What gets indexed

| Object type | API source | Represents |
| ----------- | ---------- | ---------- |
| **Space** | `GET /api/spaces/all` | An Octopus space, the container for all other objects. |
| **Project** | `GET /api/{spaceId}/projects` | A deployable project. |
| **Environment** | `GET /api/{spaceId}/environments` | An environment such as Development, Staging or Production. |
| **Deployment Target** | `GET /api/{spaceId}/machines` | A machine or cloud resource that Octopus deploys to. |
| **Tenant** | `GET /api/{spaceId}/tenants` | A tenant, for multi-tenant deployments. |
| **Runbook** | `GET /api/{spaceId}/runbooks` | A runbook belonging to a project. |
| **Worker Pool** | `GET /api/{spaceId}/workerpools` | A static or dynamic pool of workers. |
| **Worker** | `GET /api/{spaceId}/workers` | A machine in a static worker pool that runs deployment work. |

**Relationships:** every object stores the `spaceId` of the space it belongs to. Runbooks also store their project ID, deployment targets their environment and tenant IDs, and workers their worker pool IDs.

## Known limitations

- **New data sources import in two passes.** Projects, environments, deployment targets and tenants are imported per space, after spaces. On the first import of a new data source they can be skipped, and they appear on the next import.
- **Successful deployments that logged warnings show as successful**, as they do in Octopus. **Deployment Status** and **Tasks** have a separate warnings column.
- **Release Progression times are UTC.** The **Detail** column shows the deployment time as text in UTC.
- **Deployments only covers completed deployments.** Queued and running deployments appear in **Tasks** and **Deployment Status**. The timeframe is limited to the last quarter, because the deployment report isn't paged.
- **Tasks history is limited to the last 7 days.** Busy servers run many health check and retention tasks, so longer ranges could exceed response size limits. Filter by task type to keep results small. **Tasks** can't filter by environment, because the Octopus API accepts only a single environment there. Use **Deployments** or **Deployment Status** for environment views.
- **Deployment freezes are server-wide.** Octopus doesn't record a space against a freeze, so freezes are shown against the default space.
- **Dynamic worker pools list no workers.** Octopus Cloud's hosted pools are managed by Octopus and don't expose their workers.
- **Data freshness.** Objects are re-imported every 12 hours. Data streams query Octopus live.
- **Read-only.** The plugin never creates, changes or deletes anything in Octopus Deploy.
