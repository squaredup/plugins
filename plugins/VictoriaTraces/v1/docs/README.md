Analyse distributed traces in [VictoriaTraces](https://docs.victoriametrics.com/victoriatraces/) — request rate, error rate and latency (RED) per service and operation, slow and failing traces, span search and the service map — computed directly from your spans with [LogsQL](https://docs.victoriametrics.com/victorialogs/logsql/), and turn your trace resources into SquaredUp objects: services and their operations and dependencies, Kubernetes workloads and pods, and hosts.

> ⚠️ The plugin is read-only and uses only the querying API. It doesn't need Jaeger's Service Performance Monitoring or a separate metrics backend: all metrics are calculated from the spans themselves.

## Setup

You need the URL of a VictoriaTraces endpoint that serves the querying API, and credentials if it is protected.

1. Work out the query URL for your deployment:
    - **Single-node VictoriaTraces** — `http://<host>:10428`
    - **VictoriaTraces cluster** — the `vtselect` URL, `http://<vtselect>:10471`. See [cluster setup](https://docs.victoriametrics.com/victoriatraces/cluster/).
    - **Behind [vmauth](https://docs.victoriametrics.com/victoriametrics/vmauth/) or [VictoriaMetrics Cloud](https://docs.victoriametrics.com/victoriametrics-cloud/)** — the URL your proxy or deployment exposes for trace queries.

    Don't include `/select` in the URL itself.
2. If the endpoint is protected, get a **bearer token** (vmauth `bearer_token`, or a VictoriaMetrics Cloud access token with **read** access) or a **username and password** for basic authentication.
3. To check the URL, request it with `/select/jaeger/api/services` appended — it should return JSON listing your services. For an unprotected endpoint, open it in a browser; for a protected one, send the credentials too, e.g. `curl -H "Authorization: Bearer <token>" <url>/select/jaeger/api/services`.
4. If you use [multitenancy](https://docs.victoriametrics.com/victoriatraces/#multitenancy), note the **Account ID** and **Project ID** of the tenant to query.
5. If VictoriaTraces is not reachable from the internet, install a [SquaredUp relay agent](https://docs.squaredup.com/first-steps/agents) on a machine that can reach it and select its agent group when adding the data source.
6. To see the service map and dependencies, enable VictoriaTraces' [service graph](https://docs.victoriametrics.com/victoriatraces/querying/#querying-dependencies) (experimental) by setting `-servicegraph.enableTask=true` on VictoriaTraces single-node or on `vtstorage`. Without it, everything else works but **Service Dependencies**, the service map and the services' "calls" relationships stay empty.
7. In SquaredUp, add the **VictoriaTraces** data source and fill in the fields below.

## Configuration fields

| Field | What it is | Where to find it | Required |
| ----- | ---------- | ---------------- | -------- |
| **VictoriaTraces URL** | Base URL of the querying API, without `/select`. | See step 1 above. | Yes |
| **Authentication** | **None**, **Bearer token** or **Basic authentication**. | Depends on how your endpoint is protected. | Yes |
| **Bearer token** | Sent as an `Authorization: Bearer` header. Shown when **Bearer token** is selected. | Your vmauth config or VictoriaMetrics Cloud **Access tokens** page. | When using a bearer token |
| **Username** / **Password** | Basic authentication credentials. Shown when **Basic authentication** is selected. | Your vmauth or reverse proxy config. | When using basic auth |
| **Account ID** / **Project ID** | Tenant to query, sent as the `AccountID` and `ProjectID` headers. | Your VictoriaTraces multitenancy setup. | No (default tenant) |
| **Objects to index** | Tick what to discover from your spans: **Services and dependencies** (`service.name` and the calls between services), **Operations** (server and consumer span names per service), **Kubernetes** (`k8s.*` resource attributes) and **Hosts and environments** (`host.name`, `deployment.environment.name`). | Untick **Operations** if span names include IDs or full URLs. | No (all ticked by default) |
| **Indexing lookback** | How far back to look for spans when discovering objects, e.g. `1h`. | — | No (default `1h`) |
| **Default cluster name** | Cluster to assume for spans without a `k8s.cluster.name` resource attribute, so Kubernetes objects match those from the VictoriaMetrics and VictoriaLogs plugins and drilldowns resolve. | Your cluster's name. | No |

On save, the plugin lists the span stream fields seen in the last hour. A failure means the URL doesn't point at the querying API, the endpoint isn't reachable (from SquaredUp or the selected agent), or the credentials or tenant were rejected.

## What this plugin monitors

- **Service health (RED)** — request rate, error rate and p50/p95/p99 latency for every service and operation, over time or for the timeframe.
- **Slow and failing requests** — the slowest traces and traces with errors, overall or through a particular service, operation or pod, and recent failed spans with their error messages.
- **Service map** — which services call which, and how often, in dashboards and as relationships in SquaredUp's graph.
- **Where services run** — spans and RED metrics per Kubernetes pod, workload, namespace, node and host, linked to the same objects as the VictoriaMetrics and VictoriaLogs plugins.

The out-of-the-box dashboards are **Services Overview** (with a service map) plus **Service**, **Operation** and **Pod Traces** perspectives.

## Data streams

- **Service Metrics (RED)** — requests per second, error rate and p50/p95/p99 latency calculated from spans, per service, per operation or overall, as a time series or as totals for the timeframe. Measures incoming requests (server and consumer spans) by default, or outgoing calls (client spans).
- **Traces** — traces with at least one matching span, one row per trace with its root service and operation, start time, duration, span count and errors, slowest or newest first. Restricting to objects returns the whole traces that pass through them, counting the spans within the timeframe.
- **Spans** — spans matching a LogsQL filter, newest first (200 by default, up to 500), with service, operation, kind, duration, status and status message, trace and span IDs, links to the service or operation, pod, node and host, and the remaining attributes.
- **Trace Spans** — the spans of one trace (up to the first 500), in start order with their offset from the start of the trace; a **Truncated** column shows when the trace had more.
- **Span Stats** — the result of any LogsQL query over spans ending in a [`stats` pipe](https://docs.victoriametrics.com/victorialogs/logsql/#stats-pipe), as a time series or totals, with an optional **Pivot field** (pivot on `__name__` for one row per object with a column per result).
- **Service Dependencies** — calls between services in the timeframe, one row per caller and callee with the number of calls; restrict to services to see what calls them and what they call.

Every stream except **Trace Spans** can be restricted to selected objects (**Objects**) — services, operations, pods, namespaces, nodes or hosts, or for **Service Dependencies**, services only — which is how the dashboard perspectives scope their tiles.

The following streams are hidden from the tile editor's stream list but available to advanced users and dashboard variables:

- **Field Names** / **Field Values** — span fields, and the most common values of one field with span counts.
- **Connection Check**, **Label Sets** and **Dependency List** — used by setup validation and object indexing.

## What gets indexed

Objects are discovered from spans received within the **Indexing lookback**, with one `stats by (...)` query per object type, plus the service graph for dependencies. Each object stores a LogsQL filter that selects its spans, which the data streams use to restrict results to it.

| Object type | Source | Represents |
| ----------- | ------ | ---------- |
| **Service** | `service.name` resource attribute (with `service.namespace` as a property) | An instrumented service. |
| **Service Operation** | service + span name, from server and consumer spans | An operation a service handles, e.g. an HTTP route or RPC method. |
| **Service Dependency** | Service graph (`/select/jaeger/api/dependencies`) | One service calling another, with the call count. |
| **Kubernetes Cluster** / **Node** / **Namespace** / **Pod** | `k8s.cluster.name`, `k8s.node.name`, `k8s.namespace.name`, `k8s.pod.name` resource attributes | Where the services run. |
| **Kubernetes Deployment** / **StatefulSet** / **DaemonSet** / **ReplicaSet** / **Job** / **CronJob** | `k8s.deployment.name` etc. resource attributes | The workloads running the services. |
| **Host** | `host.name` resource attribute | A host. |
| **Deployment Environment** | `deployment.environment.name` resource attribute | An environment, e.g. production. |

**Relationships:** each Service **calls** the services it sends requests to (and is **called by** its callers), through its Service Dependency objects.

Kubernetes objects include the cluster in their identity — from `k8s.cluster.name`, or the **Default cluster name** when spans don't carry it — and use the same types and identities as the VictoriaMetrics and VictoriaLogs plugins. Objects are re-indexed every hour.

Results link back to these objects: rows carry **Service** or **Operation**, **Pod**, **Node** and **Host** columns that drill down to the matching object; **Service Dependencies** links both the caller and the callee.

## Known limitations

- **Read-only, querying API only** — the plugin never ingests or deletes spans.
- **Metrics are calculated from stored spans** — rates, error rates and latencies reflect the spans VictoriaTraces holds; if your pipeline samples traces, they reflect the sample, not all traffic. Error rate counts spans with an error status (`status_code` 2).
- **Indexing sees recent spans only** — objects are discovered from spans within the **Indexing lookback** (default 1 hour), so services and operations without traffic in that window aren't indexed until they receive some.
- **Operations depend on span naming** — if span names contain IDs or full URLs, untick **Operations** in **Objects to index** to avoid indexing a very large number of operations.
- **Traces and spans are capped** — **Traces** returns up to 500 traces and **Spans** up to 500 spans; a single response is limited to about 6MB. Long-lived spans such as streaming RPCs and asynchronous message consumers count towards trace durations, so "slowest" lists can be dominated by them; the dashboards' slowest-trace tiles only consider traces with a server span shorter than one minute.
- **Traces and Trace Spans see the timeframe only** — spans outside the tile's timeframe aren't included, so a trace that started before the timeframe shows only its later spans (and a later span as its root). **Trace Spans** returns the first 500 spans of a trace.
- **Service map needs the service graph** — **Service Dependencies**, the dashboards' service maps and the "calls" relationships need `-servicegraph.enableTask=true` (an experimental VictoriaTraces feature).
