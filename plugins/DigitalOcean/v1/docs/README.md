Monitor your [DigitalOcean](https://www.digitalocean.com) estate in SquaredUp — Droplets, App Platform apps, Kubernetes clusters, managed databases, load balancers, Gradient AI agents, and billing — via the [DigitalOcean API](https://docs.digitalocean.com/reference/api/).

## Setup

You will need a DigitalOcean **personal access token**. The plugin only reads data, so a token with read scopes is enough.

1. Sign in to the [DigitalOcean Control Panel](https://cloud.digitalocean.com).
2. Go to **API → Tokens** ([cloud.digitalocean.com/account/api/tokens](https://cloud.digitalocean.com/account/api/tokens)) and click **Generate New Token**.
3. Give the token a name (e.g. `SquaredUp`) and choose an **Expiration**. When the token expires, the plugin stops returning data until you supply a new one.
4. Under **Scopes**, choose **Custom Scopes** and grant **read** on: `account`, `droplet`, `app`, `kubernetes`, `database`, `load_balancer`, `monitoring`, `billing` and `genai`. A **Read Only** token also works. See [token scopes](https://docs.digitalocean.com/reference/api/scopes/) for details.
5. Click **Generate Token**, copy the token (it starts `dop_v1_`) and paste it into the **Personal access token** field.

The token belongs to one team. To monitor several teams, add the plugin once per team.

## Configuration fields

| Field                     | What it is                                                         | Where to find it                                      | Required |
| ------------------------- | ------------------------------------------------------------------ | ----------------------------------------------------- | -------- |
| **Personal access token** | Authenticates every request as a bearer token.                     | Control Panel → **API → Tokens** (see above).         | Yes      |

On save, the plugin validates the token by fetching your account details; an invalid, expired or under-scoped token fails setup with an authentication error.

## What this plugin monitors

- **Compute**: Droplet status, size, region and image, plus CPU, load, memory, disk and bandwidth history from DigitalOcean Monitoring.
- **App Platform**: app status from the active deployment, per-component health with CPU, memory and replicas, recent deployments, and CPU, memory and restart history.
- **Kubernetes**: DOKS cluster state, version and node counts, plus a per-node view of each cluster's node pools.
- **Databases and load balancers**: managed database cluster status, engine and version. Load balancer status, plus request rate, connections, response time and health-check history.
- **AI agents**: Gradient AI platform agent deployment status, model and region, token usage per agent, and evaluation test cases.
- **Billing**: month-to-date usage and balance, invoice history, and daily cost by resource, SKU and region.

The out-of-the-box dashboards include an account-wide **Overview** and a **Billing** dashboard. There is also a perspective for each **Droplet**, **App**, **Kubernetes Cluster**, **Load Balancer** and **Agent**.

## Data streams

- **Droplets**: all Droplets with their status, size, region, image and IP addresses (account-wide).
- **Droplet Metrics**: a time series for one Droplet. Choose CPU, load average, memory, filesystem or bandwidth (per Droplet).
- **Apps**: all App Platform apps with the phase of their active deployment (account-wide).
- **App Health**: health, CPU, memory and replicas for each component of an app (per app).
- **App Deployments**: the 50 most recent deployments of an app, with phase and cause (per app).
- **App Metrics**: CPU, memory or restart count time series for each component instance (per app).
- **Kubernetes Clusters**: all DOKS clusters with their state, version and node counts (account-wide).
- **Kubernetes Nodes**: worker nodes of a cluster, with their node pool, size and state (per cluster).
- **Databases**: all managed database clusters with their engine, version, status and size (account-wide).
- **Load Balancers**: all load balancers with their status, IP address, region and backend Droplet count (account-wide).
- **Load Balancer Metrics**: a time series for one load balancer metric, such as requests per second, connections, response time or health checks (per load balancer).
- **Agents**: all Gradient AI agents with their deployment status, model and region (account-wide).
- **Agent Usage**: input and output tokens used by an agent over the timeframe (per agent).
- **Evaluation Test Cases**: Gradient AI evaluation test cases with their star metric and success threshold (account-wide).
- **Balance**: month-to-date usage, month-to-date balance and account balance (account-wide).
- **Invoices**: issued invoices and the current month's preview, in USD (account-wide).
- **Cost**: daily usage cost in USD by resource, SKU and region (per account).

## What gets indexed

| Object type            | API source                    | Represents                                                     |
| ---------------------- | ----------------------------- | -------------------------------------------------------------- |
| **Account**            | `GET /v2/account`             | The DigitalOcean team the token belongs to.                    |
| **Droplet**            | `GET /v2/droplets`            | A Droplet (virtual machine).                                   |
| **App**                | `GET /v2/apps`                | An App Platform app.                                           |
| **Kubernetes Cluster** | `GET /v2/kubernetes/clusters` | A DigitalOcean Kubernetes (DOKS) cluster.                      |
| **Database**           | `GET /v2/databases`           | A managed database cluster (any engine).                       |
| **Load Balancer**      | `GET /v2/load_balancers`      | A load balancer.                                               |
| **Agent**              | `GET /v2/gen-ai/agents`       | A Gradient AI platform agent.                                  |

Kubernetes node rows link to the Droplet that backs each node, when that Droplet has been imported.

## Known limitations

- **Agent observability is partly console-only.** DigitalOcean's public API exposes agent token usage and evaluations. Agent latency, time to first token, request counts, runtime logs and traces are only available in the Control Panel.
- **Database metrics aren't included.** DigitalOcean Monitoring only offers database metrics for MySQL. The plugin reports status, engine, version and size for all engines.
- **Droplet memory, disk and load need the metrics agent.** These metrics only appear for Droplets with the [DigitalOcean metrics agent](https://docs.digitalocean.com/products/monitoring/how-to/install-metrics-agent/) installed. CPU and bandwidth work without it.
- **Bandwidth has no stated unit.** The API doesn't state a unit for Droplet bandwidth, so it's shown as a plain number.
- **Metric resolution coarsens over longer timeframes.** DigitalOcean chooses the sample interval: about 2 minutes over the last hour, falling to very few points over 7 days or more.
- **Cost covers at most 31 days.** The billing insights API caps each request at 31 days, so the **Cost** stream offers timeframes up to last 30 days or one calendar month.
- **No currency is stated for balance.** Invoices and cost are in USD; balance values are shown as plain numbers because the API names no currency.
- **Rate limits.** DigitalOcean allows 5,000 requests per hour and 250 per minute per token. Very large estates with many busy dashboards may be throttled.
- **Read-only.** The plugin never creates, modifies or deletes anything in DigitalOcean.
