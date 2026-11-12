Monitor your self-hosted [OpenObserve](https://openobserve.ai) instance in SquaredUp — streams, log/metric/trace search, pipelines, alerts, and SLOs — via the [OpenObserve API](https://openobserve.ai/docs/reference/api/).

> ⚠️ This plugin covers self-hosted OpenObserve only, and only the **Streams**, **Search**, **Metrics**, **Traces**, **Pipelines**, **Alerts**, and **SLOs** API areas — it does not cover OpenObserve Cloud, ingestion, dashboards, reports, or user management.

## Setup

You will need your OpenObserve instance's **URL**, **port**, **organization identifier**, and an **API Key** — the full HTTP Basic Auth value for that organization.

1. Sign in to your OpenObserve instance.
2. Find your **organization identifier** — `default` unless you created additional organizations.
3. Create a Service Account (or use an existing user's credentials): go to **IAM → Service Accounts**, click **Add Service Account**, and give it a name. Copy the **token** shown immediately after creation — it is shown only once.
4. Build the **API Key**: base64-encode `<login identity>:<token>` (or `<email>:<password>` for a regular user), e.g.:
   ```
   echo -n "myaccount@example.com:mytoken" | base64
   ```
5. Paste your instance URL, port, organization identifier, and the resulting API Key into the fields below. The key is sent through exactly as entered — it is not re-encoded.

## Configuration fields

| Field | What it is | Where to find it | Required |
| ----- | ---------- | ----------------- | -------- |
| **URL** | The base URL of your OpenObserve instance, including the scheme (e.g. `http://openobserve.example.com`) — no trailing slash or port. | The address you use to sign in to OpenObserve. | Yes |
| **Port** | The port your OpenObserve instance listens on. | Defaults to `5080`, OpenObserve's standard port. | Yes |
| **Organization** | The organization identifier used in every API call. | Defaults to `default`; check **IAM → Organizations** if you use a different one. | Yes |
| **API Key** | The full base64-encoded `username:password`/`username:token` pair, sent unmodified as `Authorization: Basic <key>`. | Built from a Service Account's login identity + token, or a user's email + password (see Setup step 4). | Yes |

On save, the plugin validates these by fetching your organization's stream list; an invalid URL, port, organization, or API Key fails setup with an authentication error.

## What this plugin monitors

- **Streams** — logs, metrics, and trace streams registered in your organization, with document counts, storage size, schema, and settings.
- **Search** — ad hoc SQL queries against a stream's raw log, metric, or trace records.
- **Metrics** — PromQL range queries against metrics ingested into OpenObserve, including a guided metric/label/value picker for building a query without writing PromQL.
- **Traces** — recent trace spans within a time range, for an individual trace stream.
- **Pipelines** — data-transformation pipelines and their execution history.
- **Alerts** — alert rules, with their current level and last evaluation outcome.
- **SLOs** — Service Level Objectives, with current status (SLI, coverage, error budget remaining, burn rate).

The out-of-the-box dashboards include an org-wide **Overview** plus a **Stream** perspective for drilling into an individual stream.

## Data streams

- **Streams** — streams of a chosen type (logs/metrics/traces), with name, document count, and size; account-wide. Backs import and is hidden from the tile editor.
- **Stream Details** — streams of a chosen type (logs/metrics/traces), with document counts, storage size, schema, and settings; account-wide.
- **Logs Search**, **Metrics Search**, **Traces Search** — records from one stream, either the latest records or those matching an optional SQL query; each is scoped to streams of its own type, so the object picker only lists log, metric, or trace streams respectively.
- **Traces Latest** — recent traces within the last hour, with a span count and a link to view each trace in OpenObserve; scoped to a trace stream. An optional **Bucket interval** (e.g. `5m`) switches it to one row per time bucket (trace count plus avg/min/max duration) for charting finer than the tile editor's own hourly minimum.
- **Metrics Query** — time series data matching a PromQL query; account-wide.
- **Simple Metrics Query** — time series data for a metric, built from a guided picker (metric → label → values → aggregation) instead of hand-written PromQL; account-wide.
- **Metric Names**, **Metric Labels**, **Label Values** — back the Simple Metrics Query picker's cascading dropdowns; hidden from the tile editor.
- **Pipelines** — data-transformation pipelines defined in the organization, with node/edge counts and last error; account-wide.
- **Pipeline History** — pipeline execution history within a time range; account-wide.
- **Alerts** — alert rules defined in the organization, with current level, last outcome, priority, source stream, and when each was last evaluated/triggered; account-wide. Optional **Folder** filter.
- **SLOs** — Service Level Objectives with current status (SLI, coverage, error budget remaining, burn rate); account-wide. Optional **Folder** filter.
- **Incidents**, **Incident Stats**, **Cluster Info** — hidden from the tile editor.

## What gets indexed

| Object type | API source | Represents |
| ----------- | ---------- | ---------- |
| **Stream** | `GET /api/{org}/streams` (called once per type: logs, metrics, traces) | A log, metric, or trace stream registered in the organization. |

## Known limitations

- **Search queries reference the stream with `{{object.name}}`** — the SQL Query field on Logs Search, Metrics Search, and Traces Search is pre-filled with `SELECT * FROM "{{object.name}}"`, which is replaced with the selected stream's name when the query runs (the field itself shows the expression, not the name). A blank field runs the same query.
- **Very broad search timeframes may exceed the platform's response size limit** — narrow the timeframe or reduce **Max rows** if a Logs Search, Metrics Search, Traces Search, or Traces Latest tile fails to load. A Simple Metrics Query or Metrics Query with no label filter can hit the same limit on a high-cardinality metric over a wide timeframe — add a label filter or narrow the timeframe.
- **Pipeline History's Query Took unit is inferred, not documented** — OpenObserve doesn't document the unit anywhere; it's shown as milliseconds, matching the `took` field's documented unit on the Search endpoint and the realistic magnitude seen in testing (single-digit ms for a lightweight scheduled query).
- **Pipeline History doesn't include Delay or Evaluation Took** — OpenObserve's history API has `delay_in_secs` and `evaluation_took_in_secs` fields, but they were empty on every run of the instance this plugin was tested against, so they aren't exposed as columns.
- **Traces Latest only applies to trace-type streams** — it isn't included on the Stream perspective dashboard (which covers all three stream types); add it manually on a dashboard scoped to a trace stream.
- **Traces Latest is fixed to the last hour** — `/traces/latest` runs a `GROUP BY trace_id` aggregation over every span in the chosen range before applying **Max rows**, so the scan cost scales with the timeframe, not the row limit. A wide range (e.g. a full day) can scan gigabytes of data and exhaust the server's memory. Restricted to `last1hour` to keep this safe by default.
- **Traces Latest's "View Trace" link format is unverified** — it's built from OpenObserve's documented `/web/traces/trace-details` route (`org_identifier`, `stream`, `trace_id`, `from`, `to` query params, with `from`/`to` in microseconds), but this plugin was built without being able to click through and confirm the link actually opens the right trace. If it doesn't resolve correctly, this is the first thing to check.
- **Traces Latest's Bucket interval only buckets the traces actually fetched** — it doesn't change how many traces the API returns, only **Max rows**. On a high-volume trace stream, a short bucket width (e.g. `1m`) may need a correspondingly larger **Max rows** to see more than one or two buckets, which risks the response-size limit above — there's a real trade-off between bucket granularity and how much time the buckets actually cover.
- **SLOs show blank status figures until first measured, or when stale** — SLI, burn rate, error budget remaining, and the watermark/measuring-since timestamps are intentionally blank (not zero) when **No Data** is true, matching OpenObserve's own UI — a brand-new or stalled SLO isn't the same as one measured at 0%.
- **Alerts show a blank Level until an alert has a recorded state** — an alert whose last evaluation errored can have no level yet; check **Last Outcome** for those.
- **SLO per-group status isn't covered** — only the overall SLO list with its top-level status; drilling into a grouped SLO's per-group breakdown isn't implemented.
- **Read-only** — the plugin never creates, modifies, or deletes anything in OpenObserve.
