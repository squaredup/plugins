Search and analyse logs in [VictoriaLogs](https://docs.victoriametrics.com/victorialogs/) with [LogsQL](https://docs.victoriametrics.com/victorialogs/logsql/), and turn the fields on your logs into SquaredUp objects — Kubernetes clusters, nodes, namespaces, workloads, pods and containers, OpenTelemetry services and hosts — using the VictoriaLogs [querying API](https://docs.victoriametrics.com/victorialogs/querying/).

> ⚠️ The plugin is read-only and uses only the querying API. It doesn't ingest, delete or live-tail logs.

## Setup

You need the URL of a VictoriaLogs endpoint that serves the querying API, and credentials if it is protected.

1. Work out the query URL for your deployment:
    - **Single-node VictoriaLogs** — `http://<host>:9428`
    - **VictoriaLogs cluster** — the `vlselect` URL, `http://<vlselect>:9471`. See [cluster setup](https://docs.victoriametrics.com/victorialogs/cluster/).
    - **Behind [vmauth](https://docs.victoriametrics.com/victoriametrics/vmauth/) or [VictoriaMetrics Cloud](https://docs.victoriametrics.com/victoriametrics-cloud/)** — the URL your proxy or deployment exposes for log queries.

    To check the URL, open it in a browser with `/select/logsql/field_names?query=*` appended — it should return JSON. Don't include `/select/logsql` in the URL itself.
2. If the endpoint is protected, get a **bearer token** (vmauth `bearer_token`, or a VictoriaMetrics Cloud access token with **read** access) or a **username and password** for basic authentication.
3. If you use [multitenancy](https://docs.victoriametrics.com/victorialogs/#multitenancy), note the **Account ID** and **Project ID** of the tenant to query.
4. If VictoriaLogs is not reachable from the internet, install a [SquaredUp relay agent](https://docs.squaredup.com/first-steps/agents) on a machine that can reach it and select its agent group when adding the data source.
5. In SquaredUp, add the **VictoriaLogs** data source and fill in the fields below.

## Configuration fields

| Field | What it is | Where to find it | Required |
| ----- | ---------- | ---------------- | -------- |
| **VictoriaLogs URL** | Base URL of the querying API, without `/select/logsql`. | See step 1 above. | Yes |
| **Authentication** | **None**, **Bearer token** or **Basic authentication**. | Depends on how your endpoint is protected. | Yes |
| **Bearer token** | Sent as an `Authorization: Bearer` header. Shown when **Bearer token** is selected. | Your vmauth config or VictoriaMetrics Cloud **Access tokens** page. | When using a bearer token |
| **Username** / **Password** | Basic authentication credentials. Shown when **Basic authentication** is selected. | Your vmauth or reverse proxy config. | When using basic auth |
| **Account ID** / **Project ID** | Tenant to query, sent as the `AccountID` and `ProjectID` headers. | Your VictoriaLogs multitenancy setup. | No (default tenant) |
| **Ignore certificate errors** | Skip TLS certificate validation, for self-signed certificates. | — | No |
| **Objects to index** | Tick the field conventions to discover objects from: **Kubernetes (OpenTelemetry)** (`k8s.*` attributes), **Kubernetes (log collector fields)** (Vector `kubernetes.pod_*`, Fluent Bit `kubernetes.*_name`, plain `namespace`/`pod`) and **Services and hosts (OpenTelemetry)** (`service.name`, `host.name`, `deployment.environment.name`). | Tick the conventions your logs use. | No (all ticked by default) |
| **Indexing lookback** | How far back to look for logs when discovering objects, e.g. `1h`. | — | No (default `1h`) |
| **Default cluster name** | Cluster to assume for logs without a cluster field. Set it when some or all logs lack one, so objects merge across field conventions and drilldowns resolve. | Your cluster's name. | No |

On save, the plugin lists the stream fields seen in the last hour. A failure means the URL doesn't point at the querying API, the endpoint isn't reachable (from SquaredUp or the selected agent), or the credentials or tenant were rejected.

## What this plugin monitors

- **Log search** — find log entries with LogsQL, across all logs or just those from selected pods, containers, namespaces, nodes, services or hosts.
- **Log volume and severity** — how many logs each service, namespace, pod and container produces over time, broken down by normalised severity.
- **Errors** — error and warning counts and error rate, the most common error and warning message patterns, and the most recent errors and warnings.
- **Log analytics** — any LogsQL `stats` query as a chart or table, linked back to the objects the results belong to.

The out-of-the-box dashboards are **Logs Overview** plus **Service Logs**, **Namespace Logs** and **Pod Logs** perspectives.

## Data streams

- **Logs** — log entries matching a LogsQL query in the tile's timeframe, newest first (200 by default, up to 500), with time, normalised severity (critical, error, warning, info, debug, unknown), message, and links to the pod or container, node, service and host each entry came from. The remaining fields are in a **Fields** column; list fields under **Columns** to show them as their own columns.
- **Log Stats** — the result of a LogsQL query ending in a [`stats` pipe](https://docs.victoriametrics.com/victorialogs/logsql/#stats-pipe), as a time series (range) or as totals over the timeframe (instant). An optional **Pivot field** turns values into columns — pivot on `__name__` to get one row per object with a column per stats result, e.g. `logs` and `errors`.
- **Log Volume** — the number of matching logs over time, optionally split by a field (top values plus "other").

Every stream can be restricted to selected objects (**Objects**), which works for any pod, container, namespace, node, service or host however its logs label it, and is how the dashboard perspectives scope their tiles.

The following streams are hidden from the tile editor's stream list but available to advanced users and dashboard variables:

- **Field Names** / **Field Values** — fields present in matching logs, and the values of one field, with log counts.
- **Stream Field Names** / **Stream Field Values** — the same for [log stream](https://docs.victoriametrics.com/victorialogs/keyconcepts/#stream-fields) fields.
- **Log Streams** — the log streams with matching logs.
- **Facets** — the most frequent values of every field in matching logs.
- **Connection Check** and **Label Sets** — used by setup validation and object indexing.

## What gets indexed

Objects are discovered from the fields on logs received within the **Indexing lookback**, with one `stats by (...)` query per object type and field convention. Each object stores a LogsQL filter that matches its logs in every supported convention — OpenTelemetry (`k8s.pod.name`), Vector (`kubernetes.pod_name`), Fluent Bit (`kubernetes.pod_name`, `kubernetes.namespace_name`) and plain labels (`pod`) — so the same pod found under several conventions becomes one object.

| Object type | Log fields | Represents |
| ----------- | ---------- | ---------- |
| **Kubernetes Cluster** | `k8s.cluster.name` / `cluster` | A cluster. |
| **Kubernetes Node** | `k8s.node.name` / `kubernetes.pod_node_name` / `kubernetes.host` / `node` | A node. |
| **Kubernetes Namespace** | `k8s.namespace.name` / `kubernetes.pod_namespace` / `kubernetes.namespace_name` / `namespace` | A namespace. |
| **Kubernetes Pod** | namespace + `k8s.pod.name` / `kubernetes.pod_name` / `pod` | A pod. |
| **Kubernetes Container** | namespace + pod + `k8s.container.name` / `kubernetes.container_name` / `container` | A container in a pod. |
| **Kubernetes Deployment** / **StatefulSet** / **DaemonSet** / **ReplicaSet** / **Job** / **CronJob** | namespace + `k8s.deployment.name` etc. | A workload (OpenTelemetry only). |
| **Service** | `service.name` (with `service.namespace` as a property) | An OpenTelemetry-instrumented service. |
| **Host** | `host.name` | A host. |
| **Deployment Environment** | `deployment.environment.name` / `deployment.environment` | An environment, e.g. production. |

Kubernetes objects include the cluster in their identity — from `k8s.cluster.name`/`cluster`, or the **Default cluster name** when a log has neither. Objects use the same types and identities as the VictoriaMetrics plugin. Objects are re-indexed every hour.

Query results link back to these objects: rows carry `Pod`, `Container`, `Namespace`, `Node`, `Service` and `Host` columns that drill down to the matching object. To link from a **Log Stats** query, keep the identifying fields in `by (...)`, e.g. `stats by (k8s.namespace.name, k8s.pod.name) count()`; when the tile is scoped to an object, missing cluster and namespace values are taken from that object.

## Known limitations

- **Read-only, querying API only** — the plugin never ingests, deletes or live-tails logs.
- **Indexing sees recent logs only** — objects are discovered from logs received within the **Indexing lookback** (default 1 hour), so pods, services and hosts that haven't logged in that window aren't indexed until they do. Longer lookbacks find more objects but make each import heavier on large installations.
- **Logs are capped** — **Logs** returns the newest entries up to its **Limit** (default 200, maximum 500); narrow the query or timeframe to see older entries. A single response is limited to about 6MB, so 500 very verbose entries, or many fields promoted to **Columns**, can still exceed it.
- **Severity varies by source** — severity is taken from `severity_text`, `level`, `severity`, `log.level`, `detected_level` or `loglevel`, then the OpenTelemetry `severity_number`, then a level in the message (e.g. `level=warn`, `WARN`, `info:`), and finally messages containing `error`, `exception`, `fatal` or `panic` count as errors. Logs matching none of these show as `unknown`.
- **Workloads need OpenTelemetry** — Deployments, StatefulSets, DaemonSets, ReplicaSets, Jobs and CronJobs are only discovered from OpenTelemetry `k8s.*.name` attributes; Vector and Fluent Bit don't add them by default.
- **Cluster fields** — Vector and Fluent Bit don't add a cluster field. Set **Default cluster name** for single-cluster setups; with several clusters, add a `cluster` (or `k8s.cluster.name`) field in your collector so pods in different clusters stay separate.
- **Field Values** returns at most the values VictoriaLogs reports for the timeframe, sorted by log count; the **Limit** is applied after sorting.
