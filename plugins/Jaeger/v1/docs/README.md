Monitor services, dependencies, operations, and traces from a [Jaeger](https://www.jaegertracing.io/) distributed tracing backend, via its [Query API](https://www.jaegertracing.io/docs/latest/apis/).

> ⚠️ Jaeger has no built-in authentication. If your deployment sits behind an authenticating reverse proxy, this plugin does not support that — the Query API must be reachable without credentials from the URL you provide.

## Setup

You will need the base URL of your Jaeger **Query** service (the same one that serves the Jaeger UI) — for example `http://jaeger-query:16686`.

1. If your Jaeger instance is only reachable on an internal network, install a SquaredUp [on-prem relay agent](https://docs.squaredup.com/) that can reach it, and select that agent group when adding this plugin.
2. Add this plugin and paste the base URL into the **URL** field — no scheme-relative path (like `/api`) and no trailing slash; the plugin appends those automatically.
3. If your Jaeger instance uses a self-signed certificate, enable **Ignore certificate errors**.

## Configuration fields

| Field                         | What it is                                                      | Where to find it                                  | Required |
| ----------------------------- | --------------------------------------------------------------- | ------------------------------------------------- | -------- |
| **URL**                       | The base URL of your Jaeger Query service.                      | The same host/port your Jaeger UI is served from. | Yes      |
| **Ignore certificate errors** | Skips TLS certificate validation, for self-signed certificates. | —                                                 | No       |

On save, the plugin validates the URL by fetching the list of known services; an unreachable URL or connection failure fails setup with a connection error.

## What this plugin monitors

- **Services** — every service Jaeger has seen spans for.
- **Dependencies** — call relationships between services, with call counts over a configurable lookback window.
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

- **Dependencies reflect a fixed lookback window** — the Dependencies data stream queries Jaeger's dependency graph over a selectable window (last hour up to last 7 days), not the dashboard timeframe; it has no time-range parameter of its own.
- **Traces are per-service only** — there's no cross-service trace search or single-trace detail view in this version.
- **No Service Performance Monitoring (SPM) metrics** — SPM requires a separate metrics storage backend that most Jaeger deployments don't enable, so it isn't covered here.
- **No authentication** — the Jaeger Query API has none; this plugin can't authenticate through a reverse proxy that requires it.
- **Read-only** — the plugin never creates, modifies, or deletes anything in Jaeger.
