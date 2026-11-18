Monitor the health of your [OpenSearch](https://opensearch.org) cluster, its nodes and indices, and chart search results and aggregations from your data in SquaredUp, using the [OpenSearch REST API](https://docs.opensearch.org/latest/api-reference/).

## Setup

### 1. Choose how SquaredUp reaches the cluster

This plugin runs either in the SquaredUp cloud or through a relay agent on your own network:

- **Cloud** — SquaredUp connects to the cluster directly. The **Instance URL** must be reachable from the internet, for example a public Amazon OpenSearch Service domain. If the cluster restricts access by IP address, allow the SquaredUp addresses listed in [Data security](https://docs.squaredup.com/reference/security/data-security).
- **Relay agent** — use this for a cluster on a private network, in a VPC, or on `localhost`. [Install a relay agent](https://docs.squaredup.com/features/connect-and-explore/relay-agents) on a machine that can reach the cluster's REST port (usually `9200`), then select that agent when you add the data source. The **Instance URL** is then resolved from the agent, so an internal hostname works.

### 2. Create read-only credentials

The plugin only reads data. Give it a dedicated identity with the built-in **readall_and_monitor** role, which allows searching every index and reading cluster, node and index statistics. If you only need search, the **readall** role is enough, but the cluster, node and index data streams and dashboards will be empty.

**Username and password** (any OpenSearch version, including Amazon OpenSearch Service with fine-grained access control):

1. In OpenSearch Dashboards, go to **Management → Security → Internal users** and select **Create internal user**.
2. Enter a username and password, then select **Create**.
3. Go to **Security → Roles**, open **readall_and_monitor**, select the **Mapped users** tab, then **Manage mapping**, and add the new user.

**API key** (OpenSearch 3.7 and later, with [API keys enabled](https://docs.opensearch.org/latest/security/access-control/api-keys/)):

1. As a security administrator, go to **Security → API Keys** in OpenSearch Dashboards, or call `POST _plugins/_security/api/apitokens`.
2. Grant the `cluster_monitor` cluster permission, and `read` and `indices_monitor` on the index pattern `*` (or only the indices you want to query).
3. Copy the token, which starts with `os_`. It is shown only once.

API keys expire, after 90 days at most. Create a new key and update the data source before it expires.

### 3. Add the data source

Enter the **Instance URL** and choose an **Authentication** method. If the cluster uses a self-signed certificate, which a default OpenSearch install does, turn on **Ignore certificate errors**.

### 4. Optional: import OpenTelemetry services

If the cluster stores logs from the [OpenTelemetry Collector OpenSearch exporter](https://github.com/open-telemetry/opentelemetry-collector-contrib/tree/main/exporter/opensearchexporter), turn on **Import OpenTelemetry services**. Each service that writes logs becomes an object with its own dashboard showing log volume, errors and recent log records.

The defaults match the exporter's standard document layout and index names. If your pipeline writes elsewhere, change **Log index pattern**. For a different document layout, such as Data Prepper's, also change the field settings to that layout's field names.

## Configuration fields

| Field | What it is | Where to find it | Required |
| ----- | ---------- | ---------------- | -------- |
| **Instance URL** | The base URL of the OpenSearch REST API, including the scheme and port, for example `https://opensearch.example.com:9200`. Use `https://` whenever the plugin sends credentials, as `http://` sends them unencrypted. | The address clients use to connect to the cluster. For Amazon OpenSearch Service, the domain endpoint in the AWS console. | Yes |
| **Authentication** | How the plugin signs in: **Username and password**, **API key**, or **No authentication** for a cluster with the Security plugin disabled. | — | Yes |
| **Username** | The OpenSearch user the plugin signs in as. | OpenSearch Dashboards → **Security → Internal users**. | When using username and password |
| **Password** | The password for that user. | Set when the user is created. | When using username and password |
| **API key** | An API key token, sent as `Authorization: ApiKey <token>`. | OpenSearch Dashboards → **Security → API Keys**. | When using an API key |
| **Ignore certificate errors** | Skips TLS certificate validation. Only use it for a self-signed certificate on a network path you trust, as it removes protection against interception. | — | No |
| **Import OpenTelemetry services** | Imports each service found in OpenTelemetry logs as an object and enables the service data streams. | — | No |
| **Log index pattern** | Comma-separated index names or wildcard patterns holding OpenTelemetry logs. Defaults to `ss4o_logs-*,otel-logs-*`. | The exporter's `logs_index` setting, or its default `ss4o_logs-<dataset>-<namespace>`. | When importing services |
| **Service field** | An aggregatable field holding `service.name`. Defaults to `resource.service.name.keyword`. Use `resource.service.name` if your index template maps it as a keyword. | OpenSearch Dashboards → **Discover**, or `GET <index>/_mapping`. | When importing services |
| **Timestamp field** | The log record's date field. Defaults to `@timestamp`. | As above. | When importing services |
| **Severity number field** | The numeric OpenTelemetry SeverityNumber field. Defaults to `severity.number`. | As above. | When importing services |

When you save, the plugin checks it can connect and authenticate by reading the cluster's name and version. A failure means the URL is unreachable (from the relay agent, if you selected one), the credentials are wrong, or the certificate is not trusted. A second check reads cluster health; if it fails, the user is missing the monitoring permissions above. Neither check tests search, which needs read permission on the indices you query.

## What this plugin monitors

- **Cluster health**: status, node counts, shard allocation (including unassigned shards), pending tasks and version.
- **Nodes**: heap, memory, CPU, load, disk and uptime for each node, plus roles and which node is the cluster manager.
- **Indices**: health, open or closed status, document counts and storage size for every index.
- **Your data**: any Query DSL search or aggregation, charted directly, plus document counts for KPIs and monitors. Both can follow the tile's timeframe.
- **OpenTelemetry services** (optional): log volume by severity, error counts and rates, and the latest log records for each service.

The out-of-the-box dashboards are an **Overview** of the cluster, plus a perspective for each **Node**, **Index** and **Service**.

## Data streams

- **Cluster Info**: cluster name, UUID and OpenSearch version, one row for the cluster.
- **Cluster Health**: current cluster status with node and shard counts, one row for the cluster.
- **Nodes**: current resource usage for each node, optionally filtered to selected Node objects.
- **Indices**: health, status, shard, document and storage statistics for each index, optionally filtered to selected Index objects.
- **Search Results**: documents or aggregation results from a Query DSL request against an index, alias or pattern. Set **Time field** to filter by the tile's timeframe.
- **Document Count**: the number of documents matching an optional query, with the same **Time field** option.
- **Services**: log, warning and error counts per OpenTelemetry service, with each service's environments, Kubernetes namespaces and deployments.
- **Service Log Volume**: log counts over time per service and severity.
- **Service Logs**: the most recent log records per service, newest first, with an optional minimum severity.
- **Index Names** (hidden): feeds the index picker, suggesting a wildcard pattern for each family of dated or rollover indices.

## What gets indexed

| Object type | API source | Represents |
| ----------- | ---------- | ---------- |
| **Node** | `GET _cat/nodes` | A node in the cluster, with its IP address, version and roles. |
| **Index** | `GET _cat/indices` | An open or closed index, with its UUID, creation date, primary shard count and replica count. |
| **Service** | `POST <log index pattern>/_search` (terms aggregation over the last 24 hours) | A service writing OpenTelemetry logs, with its environments, Kubernetes namespaces and Kubernetes deployments. Only imported when **Import OpenTelemetry services** is on. |

Objects are not linked to each other. Each import step is optional, so if one fails, for example because the user lacks monitoring permissions, the others still complete.

## Known limitations

- **Current values only.** OpenSearch keeps no history of its own cluster, node or index statistics, so those data streams show the current state. Use monitors or KPIs on the tiles to track them over time.
- **Search result limits.** A search returns at most 10,000 hits (the `index.max_result_window` default), and a response larger than about 6 MB fails. For large data sets, use aggregations or limit `_source` to the fields you need.
- **One aggregation per search.** When a request has several top-level aggregations, only the last one in OpenSearch's response is returned. OpenSearch places pipeline aggregations last, so a pipeline aggregation's result is the one shown. Nested bucket aggregations return one row per outer bucket.
- **The Time field needs a timeframe.** Search Results and Document Count tiles default to no timeframe. After setting **Time field**, choose a timeframe for the tile.
- **System and hidden indices are excluded** from Indices, the index picker and the import, and closed indices from the index picker, since they cannot be searched. Search a hidden index by typing its name. Index objects reflect the cluster at the last import, so an index deleted by a retention policy can remain until the next one.
- **OpenTelemetry services come from recent logs.** Each import (every 12 hours) discovers services that logged in the previous 24 hours, up to 1,000. Warnings are SeverityNumber 13–16; errors are 17 and above (ERROR and FATAL). Pods are not imported, because they change too often to keep current between imports.
- **OpenTelemetry field layout.** The environment, namespace and deployment fields are worked out from **Service field** (for example `resource.k8s.namespace.name.keyword`), so they must follow the same naming. Services without Kubernetes attributes get empty lists.
- **API keys expire** after at most 90 days. Replace the key in the data source before it does.
- **No AWS IAM authentication.** Amazon OpenSearch Service domains need fine-grained access control with an internal user. Domains that only accept IAM (SigV4) signed requests, and OpenSearch Serverless, are not supported.
- **Read-only.** The plugin never creates, changes or deletes anything in OpenSearch.
