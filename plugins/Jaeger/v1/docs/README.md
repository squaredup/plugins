Monitor services, dependencies, operations, traces and per-service performance from a [Jaeger](https://www.jaegertracing.io/) distributed tracing backend, via its [Query API](https://www.jaegertracing.io/docs/latest/apis/).

> ⚠️ Jaeger has no built-in authentication. If your deployment sits behind an authenticating reverse proxy, this plugin does not support that — the Query API must be reachable without credentials from the URL you provide.

## Setup

You will need the base URL of your Jaeger **Query** service (the same one that serves the Jaeger UI) — for example `http://jaeger-query:16686` — and to know which storage backend it is configured against.

1. If your Jaeger instance is only reachable on an internal network, install a SquaredUp [on-prem relay agent](https://docs.squaredup.com/) that can reach it, and select that agent group when adding this plugin.
2. Add this plugin and paste the base URL into the **URL** field — no scheme-relative path (like `/api`) and no trailing slash; the plugin appends those automatically.
3. Set **Dependency storage** to match your backend — see [Dependency storage](#dependency-storage) below.
4. If your Jaeger instance uses a self-signed certificate, enable **Ignore certificate errors**.

## Configuration fields

| Field                         | What it is                                                      | Where to find it                                    | Required |
| ----------------------------- | --------------------------------------------------------------- | --------------------------------------------------- | -------- |
| **URL**                       | The base URL of your Jaeger Query service.                      | The same host/port your Jaeger UI is served from.   | Yes      |
| **Ignore certificate errors** | Skips TLS certificate validation, for self-signed certificates. | —                                                   | No       |
| **Dependency storage**        | How your backend produces the service dependency graph.         | Your Jaeger storage configuration.                  | No       |

On save, the plugin validates the URL by fetching the list of known services; an unreachable URL or connection failure fails setup with a connection error.

## Dependency storage

Jaeger produces its service dependency graph in one of two ways, and the dependency data streams have to ask for a different window depending on which.

- **Pre-aggregated daily** — Elasticsearch, OpenSearch and Cassandra read the graph from a table the [`spark-dependencies`](https://github.com/jaegertracing/spark-dependencies) job writes on a schedule. That job stamps every batch it writes with **midnight UTC** rather than the time it ran, so a query for the last hour finds nothing for 23 hours of the day. Choose this option and the plugin asks for a 48-hour window, which always spans at least one written batch. Jaeger sums the call counts of the batches it finds, so a service pair is always a single row.
- **Derived from spans** — Badger and in-memory storage build the graph from the spans in the requested window. Choose this option and the plugin asks for a 1-hour window, which is as much as these backends can usually derive without timing out.

Pre-aggregated is the default, and is what an existing configuration behaves as until you choose otherwise. If dependencies are missing when the Jaeger UI's System Architecture tab shows them, this is the setting to check first.

## Service Performance Monitoring

**Call Rate**, **Error Rate** and **Latency** read Jaeger's [Service Performance Monitoring](https://www.jaegertracing.io/docs/latest/spm/) endpoints, which need a metrics backend configured on the Jaeger Query service. Jaeger supports two ways of providing one, and these streams work with either:

- **Pre-computed into a PromQL-compatible store** — the OpenTelemetry Collector's `spanmetrics` connector derives RED metrics from spans and writes them to Prometheus (or any other PromQL-compatible backend), which Jaeger Query then reads.
- **Computed directly from trace storage** — on Elasticsearch and OpenSearch, Jaeger Query calculates the metrics at query time from the traces it already holds, with no connector and no separate metrics store. Point `jaeger_query.storage.metrics` at the same backend as `traces`.

If neither is configured, these three streams return the error Jaeger itself reports and the other streams are unaffected.

Each of the three accepts a **Split by operation** parameter, which returns one series per operation instead of one for the service as a whole. **Service Latency** also takes a **Quantile** — the RED Metrics perspective charts 0.5, 0.95 and 0.99 side by side, since a single quantile can't distinguish a slower median from a heavier tail.

## What this plugin monitors

- **Services** — every service Jaeger has seen spans for.
- **Dependencies** — call relationships between services, with call counts.
- **Operations** — the operation (endpoint/method) names reported by a service.
- **Traces** — individual spans reported by a service, including duration, kind and status, each carrying its trace ID.
- **Performance** — call rate, error rate and latency per service, where SPM is enabled.

The out-of-the-box dashboards include an estate-wide **Overview**, plus two per-service perspectives: **Tracing** (operations, spans and call paths) and **RED Metrics** (call rate, error rate, and latency at the 50th, 95th and 99th percentiles). RED Metrics needs [SPM enabled](#service-performance-monitoring); Tracing works against any Jaeger.

## Data streams

| Stream                   | Scope        | Returns                                                                    |
| ------------------------ | ------------ | -------------------------------------------------------------------------- |
| **Services**             | Account-wide | Services known to the Jaeger backend.                                      |
| **Dependencies**         | Account-wide | Call dependencies between services, one row per parent-child pair.         |
| **Service Dependencies** | Per Service  | Call paths into and out of one service.                                    |
| **Operations**           | Per Service  | Operation names reported by a service.                                     |
| **Traces**               | Per Service  | Spans reported by a service, filterable by operation and minimum duration. |
| **Service Call Rate**    | Per Service  | Requests per second, as a time series.                                     |
| **Service Error Rate**   | Per Service  | Proportion of requests that failed, as a time series.                      |
| **Service Latency**      | Per Service  | Request latency at a chosen quantile, as a time series.                    |

## What gets indexed

| Object type    | API source               | Represents                                 |
| -------------- | ------------------------- | ------------------------------------------ |
| **Service**    | `GET /api/v3/services`   | A service Jaeger has seen spans for.       |
| **Dependency** | `GET /api/dependencies`  | A call relationship between two services.  |

Each Dependency row carries `parent` and `child` properties naming the two Services involved. A correlation rule uses those Dependency objects to bridge the two Services directly, giving every caller a **depends on** relationship to the service it calls — so the estate's call graph is traversable service to service.

## Known limitations

- **Dependencies are not timeframe-filtered** — the window is fixed by the **Dependency storage** setting rather than the dashboard timeframe, because pre-aggregated storage only writes the graph once per UTC day and a dashboard timeframe finer than that would silently return nothing.
- **Dependencies derived from spans lag behind** — under **Derived from spans**, the graph covers only the trailing hour, so a call path that last happened before then won't appear until it recurs. That 1-hour ceiling is what these backends can derive without timing out.
- **Traces are per-service only** — there's no cross-service trace search, and no single-trace detail view. Individual spans are listed per service with their trace ID, which you can paste into the Jaeger UI to see the full span tree.
- **Trace search can't filter by tag** — Jaeger's stable v3 API doesn't accept attribute filters over HTTP, so the Traces stream filters by operation and minimum duration only.
- **Filtering by operation still returns the whole trace** — Jaeger matches the operation to select traces, not spans, so the rows include every span in those traces, including ones named differently.
- **Service Performance Monitoring needs enabling in Jaeger** — see [above](#service-performance-monitoring). Without it the three performance streams return an error.
- **No authentication** — the Jaeger Query API has none; this plugin can't authenticate through a reverse proxy that requires it.
- **Read-only** — the plugin never creates, modifies, or deletes anything in Jaeger.
