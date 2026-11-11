Query [VictoriaMetrics](https://victoriametrics.com) with [MetricsQL](https://docs.victoriametrics.com/victoriametrics/metricsql/) and turn the labels on your metrics into SquaredUp objects — Kubernetes clusters, nodes, namespaces, workloads and pods, OpenTelemetry services and hosts, and scrape targets — using the VictoriaMetrics [Prometheus-compatible querying API](https://docs.victoriametrics.com/victoriametrics/url-examples/).

> ⚠️ The plugin is read-only and uses only the querying API. Graphite, InfluxDB, OpenTSDB and Datadog query APIs, writes, and admin endpoints are not used.

## Setup

You need the URL of a VictoriaMetrics endpoint that serves the Prometheus querying API, and credentials if it is protected.

1. Work out the query URL for your deployment:
    - **Single-node VictoriaMetrics** — `http://<host>:8428`
    - **VictoriaMetrics cluster** — the `vmselect` URL including the tenant, `http://<vmselect>:8481/select/<accountID>/prometheus` (use `0` as the account ID if you don't use multitenancy). See [URL format](https://docs.victoriametrics.com/victoriametrics/cluster-victoriametrics/#url-format).
    - **Behind [vmauth](https://docs.victoriametrics.com/victoriametrics/vmauth/) or [VictoriaMetrics Cloud](https://docs.victoriametrics.com/victoriametrics-cloud/)** — the URL your proxy or deployment exposes for queries.

    To check the URL, open it in a browser with `/api/v1/labels` appended — it should return JSON. The base URL on its own returns an `unsupported path` error; that is expected, because it is only the prefix the plugin adds API paths to.
2. If the endpoint is protected, get a **bearer token** (vmauth `bearer_token`, or a VictoriaMetrics Cloud access token with **read** access) or a **username and password** for basic authentication.
3. If VictoriaMetrics is not reachable from the internet, install a [SquaredUp relay agent](https://docs.squaredup.com/first-steps/agents) on a machine that can reach it and select its agent group when adding the data source.
4. In SquaredUp, add the **VictoriaMetrics** data source and fill in the fields below.
5. (Optional) To see alerts and recording/alerting rules, configure `-vmalert.proxyURL` on VictoriaMetrics single-node or `vmselect`, so that `/api/v1/alerts` and `/api/v1/rules` are proxied to [vmalert](https://docs.victoriametrics.com/victoriametrics/vmalert/).

## Configuration fields

| Field | What it is | Where to find it | Required |
| ----- | ---------- | ---------------- | -------- |
| **VictoriaMetrics URL** | Base URL of the Prometheus querying API, without `/api/v1`. | See step 1 above. | Yes |
| **Authentication** | **None**, **Bearer token** or **Basic authentication**. | Depends on how your endpoint is protected. | Yes |
| **Bearer token** | Sent as an `Authorization: Bearer` header. Shown when **Bearer token** is selected. | Your vmauth config or VictoriaMetrics Cloud **Access tokens** page. | When using a bearer token |
| **Username** / **Password** | Basic authentication credentials. Shown when **Basic authentication** is selected. | Your vmauth or reverse proxy config. | When using basic auth |
| **Ignore certificate errors** | Skip TLS certificate validation, for self-signed certificates. | — | No |
| **Default cluster name** | Cluster to assume for series without a `cluster` or `k8s.cluster.name` label. Set it when some or all series lack a cluster label, so the same pod seen through different label conventions becomes one object and drilldowns from charts resolve. | Under **Object indexing**. Your cluster's name, e.g. the `cluster` label on your other series. | No |
| **Scrape jobs and targets** | Index `job` and `instance` objects from the `up` metric. | Under **Object indexing**. | No (on by default) |
| **Kubernetes (standard labels)** | Index Kubernetes objects from `namespace`, `pod`, `node`, `service`, … labels (kube-state-metrics, cAdvisor, kubelet). | Under **Object indexing**. | No (on by default) |
| **Kubernetes (OpenTelemetry)** | Index Kubernetes objects from OpenTelemetry `k8s.*` resource attributes. | Under **Object indexing**. | No (on by default) |
| **Services and hosts (OpenTelemetry)** | Index services, hosts and environments from OpenTelemetry resource attributes. | Under **Object indexing**. | No (on by default) |
| **Cloud resources (OpenTelemetry)** | Index AWS, GCP and Heroku resources from OpenTelemetry cloud attributes. | Under **Object indexing**. | No (on by default) |

On save, the plugin requests one label name from `/api/v1/labels`. A failure means the URL doesn't point at the querying API, the endpoint isn't reachable (from SquaredUp or the selected agent), or the credentials were rejected.

## What this plugin monitors

- **Any metric, any query** — run MetricsQL or PromQL against VictoriaMetrics and chart the results, account-wide or scoped to the objects you pick.
- **Kubernetes** — cluster, namespace, workload, pod and node utilisation and saturation, with CPU and memory shown against requests, limits and allocatable capacity, plus restarts, OOM kills, throttling and pod phases. Works with kube-state-metrics, cAdvisor and node-exporter, and with the OpenTelemetry Collector's Kubernetes receivers.
- **Services** — request rate, error rate and p50/p95/p99 latency for OpenTelemetry-instrumented services (HTTP and gRPC, old and new semantic conventions), plus host CPU, memory, disk and network.
- **Alerting** — firing and pending vmalert alerts, and the health of alerting and recording rules.
- **Cardinality and metadata** — series counts, top metrics and labels, unused metrics, label names and values.

The out-of-the-box dashboards are **Alerts**; a **Kubernetes** folder with **Cluster Overview** and **Namespace**, **Workload**, **Pod** and **Node** perspectives; and a **Services** folder with **Services Overview** and **Service** and **Host** perspectives.

## Data streams

- **MetricsQL Query** — the result of any MetricsQL or PromQL expression, as a time series (range) or latest values (instant), one row per sample with every label as a column. Account-wide, or restricted to selected objects: the objects' label selectors are applied to every series selector in the query, so one query works for any pod, service or host. An optional **Pivot label** turns the values of one label into columns — e.g. combine several queries with `label_set(..., "kpi", "cpu") or label_set(..., "kpi", "memory")` and pivot on `kpi` to get one table row per object with a `cpu` and a `memory` column.
- **Alerts** — firing and pending alerts from vmalert, with severity, value, summary and labels. Account-wide.
- **Rules** — alerting and recording rules from vmalert with their state, health, active alert count and last error. Account-wide.

The following streams are hidden from the tile editor's stream list but available to advanced users, dashboard variables and other plugins' tiles:

- **Label Names** — label names, optionally filtered by a series selector.
- **Label Values** — values of one label, optionally filtered by a series selector.
- **Series** — label sets of the series matching a selector.
- **Series Count** — total number of series in the database.
- **Metric Metadata** — type, unit and help text per metric.
- **Cardinality** — top series counts by metric name, label and label value pair (the TSDB status / cardinality explorer API).
- **Metric Name Usage** — how often each metric name is queried, for finding unused metrics.
- **Raw Samples** — raw samples of the series matching a selector (export API).
- **Exemplars** — exemplars, such as trace IDs, attached to series.
- **Connection Check** and **Label Sets** — used by setup validation and object indexing.

## What gets indexed

Objects are discovered from the labels on your current series, with one `count by` query per object type. Each object stores its label values and a selector that matches its series in all supported naming conventions — standard Kubernetes labels (`pod`), OpenTelemetry dotted (`k8s.pod.name`) and OpenTelemetry underscored (`k8s_pod_name`) — so the same pod found under several conventions becomes one object.

| Object type | API source | Represents |
| ----------- | ---------- | ---------- |
| **Scrape Job** | `job` on `up` | A scrape job. |
| **Scrape Target** | `job`, `instance` on `up` | A scraped target. |
| **Kubernetes Cluster** | `cluster` / `k8s.cluster.name` | A cluster. |
| **Kubernetes Node** | `node` / `k8s.node.name` | A node. |
| **Kubernetes Namespace** | `namespace` / `k8s.namespace.name` | A namespace. |
| **Kubernetes Pod** | `namespace`+`pod` / `k8s.namespace.name`+`k8s.pod.name` | A pod. |
| **Kubernetes Container** | …+`container` / …+`k8s.container.name` | A container in a pod. |
| **Kubernetes Service** | `namespace`+`service` | The Kubernetes service a target was scraped through. |
| **Kubernetes Ingress** | `namespace`+`ingress` | An ingress (kube-state-metrics). |
| **Kubernetes Deployment** | `deployment` / `k8s.deployment.name` | A deployment. |
| **Kubernetes StatefulSet** | `statefulset` / `k8s.statefulset.name` | A StatefulSet. |
| **Kubernetes DaemonSet** | `daemonset` / `k8s.daemonset.name` | A DaemonSet. |
| **Kubernetes ReplicaSet** | `replicaset` / `k8s.replicaset.name` | A ReplicaSet. |
| **Kubernetes Job** | `job_name` / `k8s.job.name` | A Job. |
| **Kubernetes CronJob** | `cronjob` / `k8s.cronjob.name` | A CronJob. |
| **Service** | `service.name` (with `service.namespace` as a property) | An OpenTelemetry-instrumented service. |
| **Host** | `host.name` | A host. |
| **Deployment Environment** | `deployment.environment.name` | An environment, e.g. production. |
| **Cloud Resource** | `cloud.resource_id` | A cloud resource. |
| **FaaS Function** | `faas.name` | A serverless function. |
| **Device** | `device.id` | A device. |
| **AWS ECS Cluster** / **AWS ECS Container** / **AWS EKS Cluster** | `aws.ecs.cluster.arn`, `aws.ecs.container.arn`, `aws.eks.cluster.arn` | AWS container resources. |
| **GCP GCE Instance** / **GCP Cloud Run Job Execution** | `gcp.gce.instance.hostname`, `gcp.cloud_run.job.execution` | GCP compute resources. |
| **Heroku App** | `heroku.app.id` | A Heroku app. |

Every Kubernetes object other than the cluster includes the cluster in its identity — from the `cluster`/`k8s.cluster.name` label, or the **Default cluster name** when a series has neither — so identically named objects in different clusters stay separate. Objects are re-indexed every hour.

Query results link back to these objects: each row of **MetricsQL Query** carries a `Pod`, `Namespace`, `Node`, `Service`, `Host` (etc.) column, built from the series' labels, that drills down to the matching object. Within the Kubernetes hierarchy only the most specific object gets a link (a container rather than its pod), so charts stay clickable. To link from an aggregated query, keep the identifying labels in `by (...)` — e.g. `sum by (cluster, namespace, pod)`; when the tile is scoped to an object, missing cluster and namespace labels are taken from that object.

## Known limitations

- **Read-only, querying API only** — the plugin never writes to VictoriaMetrics or calls admin endpoints. Graphite, InfluxDB, OpenTSDB and Datadog query APIs aren't used.
- **Response size** — a single request can return at most about 6MB. Range queries default to roughly 300 points per series; for queries returning many series over long timeframes, aggregate (e.g. `sum by (...)`) or set a larger **Step**. **Raw Samples** is limited to timeframes up to 12 hours and should be used with narrow selectors.
- **Indexing sees current series** — objects come from series present at the time of the import (the default 5-minute lookback), so short-lived pods and jobs that finished between imports aren't indexed.
- **Cluster labels** — if only some of your series carry a cluster label and **Default cluster name** is empty, the same object can be indexed twice (with and without its cluster). Set **Default cluster name** for single-cluster setups; for several clusters, add `k8s.cluster.name` (e.g. with the OpenTelemetry `resource` or `k8sattributes` processor) or a `cluster` external label to every series.
- **Drilldown from aggregated queries** — a query result links to an object only when its series still carry the labels that identify the object (or the tile is scoped to it). Results of `sum(...)` without `by` have no links.
- **Workload and Node perspectives depend on your labels** — cAdvisor and kube-state-metrics container series don't carry `deployment`, `statefulset` or `daemonset` labels, so on the **Workload** dashboard CPU, memory, throttling, requests and restarts appear only if those labels are added by relabelling or the series come from the OpenTelemetry Collector's Kubernetes receivers (which add `k8s.deployment.name` etc.). Likewise, the **Node** dashboard's utilisation gauges need node-exporter series to carry a `node` label (relabel from `__meta_kubernetes_pod_node_name`) or OpenTelemetry `k8s.node.name`.
- **Alerts and rules need vmalert** — **Alerts** and **Rules** only return data when `-vmalert.proxyURL` is configured on VictoriaMetrics single-node or `vmselect`.
- **Version-dependent endpoints** — **Metric Metadata**, **Metric Name Usage** and **Exemplars** need a recent VictoriaMetrics release with the corresponding features enabled; on older versions they return no rows or an error.
- **Series Count** reports the total for the whole database; VictoriaMetrics ignores selectors on this endpoint.
