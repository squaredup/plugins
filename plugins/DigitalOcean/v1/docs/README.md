Monitor your [DigitalOcean](https://www.digitalocean.com) estate in SquaredUp — Droplets, App Platform apps, Kubernetes clusters, managed databases, load balancers, Gradient AI agents, and billing — via the [DigitalOcean API](https://docs.digitalocean.com/reference/api/).

## Setup

You will need a DigitalOcean **personal access token**. The plugin only reads data, so a token with read scopes is enough.

1. Sign in to the [DigitalOcean Control Panel](https://cloud.digitalocean.com).
2. Go to **API → Tokens** ([cloud.digitalocean.com/account/api/tokens](https://cloud.digitalocean.com/account/api/tokens)) and click **Generate New Token**.
3. Give the token a name (e.g. `SquaredUp`) and choose an **Expiration**. When the token expires, the plugin stops returning data until you supply a new one.
4. Under **Scopes**, choose **Custom Scopes** and grant **read** on: `account`, `droplet`, `app`, `kubernetes`, `database`, `load_balancer`, `monitoring`, `billing`, `genai`, `vpc`, `project`, `agent_harness_session` and `signals`. A **Read Only** token also works. See [token scopes](https://docs.digitalocean.com/reference/api/scopes/) for details.
5. Click **Generate Token**, copy the token (it starts `dop_v1_`) and paste it into the **Personal access token** field.

The token belongs to one team. To monitor several teams, add the plugin once per team.

## Configuration fields

| Field                     | What it is                                                         | Where to find it                                      | Required |
| ------------------------- | ------------------------------------------------------------------ | ----------------------------------------------------- | -------- |
| **Personal access token** | Authenticates every request as a bearer token.                     | Control Panel → **API → Tokens** (see above).         | Yes      |

On save, the plugin validates the token by fetching your account details, so an invalid or expired token, or one without the `account:read` scope, fails setup. Other scopes are not checked on save — a token missing one shows errors on the tiles that need it.

## What this plugin monitors

- **Compute**: Droplet status, size, region and image, plus CPU, load, memory, disk and bandwidth history from DigitalOcean Monitoring.
- **App Platform**: app status from the active deployment, per-component health with CPU, memory and replicas, recent deployments, and CPU, memory and restart history.
- **Kubernetes**: DOKS cluster state, version and node counts, plus a per-node view of each cluster's node pools.
- **Databases and load balancers**: managed database cluster status, engine and version. Load balancer status, plus request rate, connections, response time and health-check history.
- **AI agents**: Gradient AI platform agent deployment status, model and region, token usage per agent, and evaluation test cases.
- **Harness Runtime**: environments, agent sessions (status, agent, last activity), and cron and webhook triggers with their execution history. Where Signals collection is switched on, each environment's conversations (turns, duration, detected signals), and each session's turns (tool calls, token usage) and the signals detected in them.
- **Projects and networking**: projects and the resources assigned to them, and VPCs with the Droplets, clusters, load balancers and databases inside each.
- **Billing**: month-to-date usage and balance, invoice history, and daily cost by resource, SKU and region.

The out-of-the-box dashboards include an account-wide **Overview** and a **Billing** dashboard. Perspectives follow DigitalOcean's own navigation: **Projects**, **Managed Agents** (Agent), **Data & Learning** (Database) and **Core Cloud** (Droplet, App, Kubernetes Cluster, Load Balancer, VPC).

## Data streams

- **Projects**: all projects with their purpose and environment (account-wide).
- **Project Resources**: the resources assigned to a project, with their type and when they were assigned (per project).
- **VPCs**: all VPC networks with their region and IP range (account-wide).
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
- **Environments**: all Harness Runtime environment configs (account-wide).
- **Agent Sessions**: Harness Runtime sessions with their status, agent kind and last activity, optionally filtered to an environment (account-wide).
- **Triggers**: Harness Runtime cron and webhook triggers with their status and schedule (account-wide).
- **Trigger Executions**: each run of a trigger, with status, duration and failure reason (per trigger).
- **Conversation Signals**: conversations Signals recorded for an environment, with turns, duration and number of detected signals (per environment).
- **Session Dialogues**: each turn of a session with its run status, tool calls and failures, tool time, token usage and detected signals (per agent session).
- **Session Signals**: each behavioral signal detected in a session, such as an execution failure or a tool loop, with its category, confidence and detail (per agent session).
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
| **Environment**        | `GET /v2/agents/configs`      | A Harness Runtime environment config.                          |
| **Agent Session**      | `GET /v2/agents/sessions`     | A Harness Runtime session (destroyed sessions are skipped).    |
| **Trigger**            | `GET /v2/agents/triggers`     | A Harness Runtime cron or webhook trigger.                     |
| **VPC**                | `GET /v2/vpcs`                | A VPC network.                                                 |
| **Project**            | `GET /v2/projects`            | A project that groups resources.                               |
| **Project Resource**   | `GET /v2/projects/{id}/resources` | One resource's membership of a project; links resources to their project. |

**Relationships:** Droplets that are Kubernetes worker nodes link to their **Kubernetes Cluster**. Droplets, clusters, load balancers and databases link to their **VPC**. Each load balancer links to its first backend Droplet. Droplets, apps, clusters, databases, load balancers and agents link to the **Project** they belong to. Agent sessions link to the **Environment** they were started from, and triggers to the session they are bound to.

## Known limitations

- **Agent observability is partly console-only.** DigitalOcean's public API exposes agent token usage and evaluations. Agent latency, time to first token, request counts, runtime logs and traces are only available in the Control Panel.
- **Database metrics aren't included.** DigitalOcean Monitoring only offers database metrics for MySQL. The plugin reports status, engine, version and size for all engines.
- **Droplet memory, disk and load need the metrics agent.** These metrics only appear for Droplets with the [DigitalOcean metrics agent](https://docs.digitalocean.com/products/monitoring/how-to/install-metrics-agent/) installed. CPU and bandwidth work without it.
- **Bandwidth has no stated unit.** The API doesn't state a unit for Droplet bandwidth, so it's shown as a plain number.
- **Metric resolution coarsens over longer timeframes.** DigitalOcean chooses the sample interval: about 2 minutes over the last hour, falling to very few points over 7 days or more.
- **Cost covers at most 31 days.** The billing insights API caps each request at 31 days, so the **Cost** stream offers timeframes up to last 30 days or one calendar month.
- **No currency is stated for balance.** Invoices and cost are in USD; balance values are shown as plain numbers because the API names no currency.
- **Load balancers link to one backend Droplet.** Relationships match single values, so a load balancer with several backend Droplets is linked to the first one only. The **Backend Droplets** count shows the full number.
- **Relationships appear after an import.** They are worked out after each import finishes. On a newly added data source, project memberships are imported from the second import onwards (by default 12 hours later).
- **Some project resources aren't imported.** Spaces, volumes, snapshots and reserved IPs appear in a project's resource list but aren't imported as objects, so they don't link to anything.
- **Harness Runtime lists stop at 200.** Environments, agent sessions, triggers and each trigger's executions return the first 200 items, because the API's paging can't be followed to the end.
- **Signals needs collection switched on.** Conversation Signals and Session Dialogues only return data for environments where Signals collection is enabled in DigitalOcean.
- **Rate limits.** DigitalOcean allows 5,000 requests per hour and 250 per minute per token. Very large estates with many busy dashboards may be throttled.
- **Read-only.** The plugin never creates, modifies or deletes anything in DigitalOcean.
