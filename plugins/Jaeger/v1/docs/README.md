Monitor services, dependencies, operations, and traces from a [Jaeger](https://www.jaegertracing.io/) distributed tracing backend, via its [Query API](https://www.jaegertracing.io/docs/latest/apis/).

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

Jaeger produces its service dependency graph in one of two ways, and the Dependencies data stream has to ask for a different window depending on which.

- **Pre-aggregated daily** — Elasticsearch, OpenSearch and Cassandra read the graph from a table the [`spark-dependencies`](https://github.com/jaegertracing/spark-dependencies) job writes on a schedule. That job stamps every batch it writes with **midnight UTC** rather than the time it ran, so a query matching a 1-hour dashboard timeframe finds nothing for 23 hours of the day. Choose this option and the plugin rounds the query back to the UTC midnight at or before the timeframe start, then sums the call counts of the batches it gets back.
- **Derived from spans** — Badger and in-memory storage build the graph from the spans in the requested window. Choose this option and the plugin queries the selected timeframe unchanged, which keeps the query as cheap as the timeframe is short.

Pre-aggregated is the default, and is what an existing configuration behaves as until you choose otherwise. If dependencies are missing when the Jaeger UI's System Architecture tab shows them, this is the setting to check first.

## What this plugin monitors

- **Services** — every service Jaeger has seen spans for.
- **Dependencies** — call relationships between services, with call counts over the selected timeframe.
- **Operations** — the operation (endpoint/method) names reported by a service.
- **Traces** — individual spans reported by a service within a selected timeframe, including duration, kind, and status.

The out-of-the-box dashboards include an estate-wide **Overview** plus a **Service** perspective.

## Data streams

- **Services** — services known to the Jaeger backend, account-wide.
- **Dependencies** — call dependencies between services, one row per parent-child pair, account-wide.
- **Operations** — operation names reported by a service, per service.
- **Traces** — spans reported by a service within the selected timeframe, per service.

## What gets indexed

| Object type    | API source               | Represents                                 |
| -------------- | ------------------------- | ------------------------------------------ |
| **Service**    | `GET /api/v3/services`   | A service Jaeger has seen spans for.       |
| **Dependency** | `GET /api/dependencies`  | A call relationship between two services.  |

Each Dependency row carries `parent` and `child` properties naming the two Services involved in that call path.

## Known limitations

- **Dependencies are no finer-grained than the storage is** — with **Pre-aggregated daily** storage the graph is only written once per UTC day, so the plugin rounds the timeframe out to whole days. Last 1 hour and last 12 hours consequently return the same rows: everything recorded so far today.
- **Dependencies' timeframe is restricted to last 1 hour–last 7 days** — Jaeger's dependency-graph query is comparatively expensive, so the range of selectable timeframes is deliberately narrower than Traces' full range.
- **Scheduled indexing of Dependencies uses a 1-hour window** — the index step asks for last 1 hour, which covers the whole of the current UTC day under **Pre-aggregated daily** storage, but is a strict 1-hour trailing window under **Derived from spans**. In that case a dependency that only occurred outside the trailing hour won't be indexed until it recurs within one.
- **Traces are per-service only** — there's no cross-service trace search or single-trace detail view in this version.
- **No Service Performance Monitoring (SPM) metrics** — SPM requires a separate metrics storage backend that most Jaeger deployments don't enable, so it isn't covered here.
- **No authentication** — the Jaeger Query API has none; this plugin can't authenticate through a reverse proxy that requires it.
- **Read-only** — the plugin never creates, modifies, or deletes anything in Jaeger.
