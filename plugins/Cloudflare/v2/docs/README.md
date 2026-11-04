Monitor your [Cloudflare](https://www.cloudflare.com) account in SquaredUp - zone traffic and cache performance, firewall and WAF activity, DNS records and SSL certificate expiry, plus the developer platform: Workers, R2, KV, D1, Queues, Pages, Tunnels, Load Balancers and Access applications. Data comes from the [Cloudflare REST API](https://developers.cloudflare.com/api/) and the [GraphQL Analytics API](https://developers.cloudflare.com/analytics/graphql-api/).

> ⚠️ This plugin is **read-only** and never changes anything in your Cloudflare account. It does not cover Logpush, Magic Transit, Magic WAN, Spectrum or Waiting Room.

## Setup

You will need a Cloudflare **API token**. Legacy Global API Keys are not supported.

1. Sign in to the [Cloudflare dashboard](https://dash.cloudflare.com).
2. Go to [**My Profile → API Tokens**](https://dash.cloudflare.com/profile/api-tokens) and click **Create Token**.
3. Scroll to the bottom and choose **Create Custom Token → Get started**.
4. Give the token a name, such as `SquaredUp`.
5. Under **Permissions**, add each row below. Every one is **Read** - the plugin never writes. Omit a row only if you do not use that product; the matching import step is optional and will report a warning rather than failing the import.

    | Scope       | Permission                       | Access   |
    | ----------- | -------------------------------- | -------- |
    | **Account** | Account Settings                 | **Read** |
    | **Account** | Account Analytics                | **Read** |
    | **Account** | Workers Scripts                  | **Read** |
    | **Account** | Workers R2 Storage               | **Read** |
    | **Account** | Workers KV Storage               | **Read** |
    | **Account** | D1                               | **Read** |
    | **Account** | Queues                           | **Read** |
    | **Account** | Cloudflare Pages                 | **Read** |
    | **Account** | Cloudflare Tunnel                | **Read** |
    | **Account** | Load Balancing: Monitors and Pools | **Read** |
    | **Account** | Access: Apps and Policies        | **Read** |
    | **Zone**    | Zone                             | **Read** |
    | **Zone**    | Zone Analytics                   | **Read** |
    | **Zone**    | DNS                              | **Read** |
    | **Zone**    | SSL and Certificates             | **Read** |
    | **Zone**    | Health Checks                    | **Read** |

   The Durable Objects, Vectorize, Hyperdrive, Stream, Turnstile, AI Gateway, AutoRAG, Containers, Pipelines and Realtime endpoints were all reachable in testing with the permissions above and needed nothing extra. If your account restricts those products and their imports come back empty, add their **Read** permissions too. The Zero Trust Gateway streams read through **Account Analytics**, so they need no separate Gateway permission.

6. Under **Account Resources**, choose **Include → All accounts** (or select the specific accounts you want SquaredUp to see).
7. Under **Zone Resources**, choose **Include → All zones from an account** or **All zones**.
8. Leave **Client IP Address Filtering** empty unless your SquaredUp agent has a fixed egress IP, and set **TTL** to a long expiry or leave it unset - an expired token stops all data collection.
9. Click **Continue to summary**, then **Create Token**, and copy the token shown. Cloudflare displays it **once only**.
10. Paste it into the **API token** field in SquaredUp.

For more detail see Cloudflare's own guide to [creating API tokens](https://developers.cloudflare.com/fundamentals/api/get-started/create-token/).

## Configuration fields

| Field         | What it is                                                                                     | Where to find it                                                                                                    | Required |
| ------------- | ---------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- | -------- |
| **API token** | A Cloudflare API token, sent as `Authorization: Bearer <token>` on every request to the API. | Cloudflare dashboard → [**My Profile → API Tokens**](https://dash.cloudflare.com/profile/api-tokens) → **Create Custom Token**. | Yes      |

On save, the plugin verifies the token against Cloudflare's token-verification endpoint. A failure means the token is invalid, expired or revoked - it does **not** check individual permissions, so a token that saves successfully can still return no data for a product whose permission you left out.

## What this plugin monitors

- **Zone traffic and caching** - requests, bandwidth, cached requests and bytes, page views, unique visitors and cache hit ratio per hour, plus breakdowns by country, status code, cache status, host, device type, HTTP protocol and content type.
- **Security** - firewall and WAF events by rule, service, country, host, user agent or path, with the action Cloudflare took; and SSL certificate inventory with days until expiry.
- **DNS and availability** - every DNS record in a zone with its type, content, TTL and proxy status; standalone health checks; and load balancer request distribution and per-origin pool health.
- **Web performance** - Core Web Vitals (Largest Contentful Paint, Interaction to Next Paint, Cumulative Layout Shift) and page-load volume from Cloudflare Web Analytics, per zone.
- **Developer platform** - Worker invocations, errors, subrequests and CPU-time percentiles; R2 bucket operations and stored size; KV operations, latency and stored keys; D1 query counts, rows touched and database size; Queue message operations and backlog; Durable Object invocations and storage; Vectorize and Hyperdrive query volume; Workers AI inference by model; and Pages deployment history with branch and commit.
- **Dependency mapping** - which Worker binds which KV namespace, R2 bucket, D1 database, queue, Durable Object namespace, Vectorize index or Hyperdrive config, and which zones each Worker serves.
- **Zero Trust** - Access application inventory and login attempts, Tunnel connector health, Turnstile challenges, and Gateway DNS, HTTP and network filtering activity.
- **Media** - Cloudflare Stream minutes viewed and playback quality, Images request and transformation volume, and Realtime bandwidth.
- **AI platform** - AI Gateway requests, errors, cache and cost by model or provider; AutoRAG query volume; Vectorize; Workers AI inference; and Browser Rendering sessions.
- **Email** - Email Routing message flow and DMARC alignment per zone.

The out-of-the-box dashboards open with a **Cloudflare Overview**, with perspectives grouped by Cloudflare product family - Core, Compute, Storage & Databases, AI, Media, Zero Trust and Traffic. Worker Routes and Worker Bindings are indexed and drive the relationship graph but have no perspective of their own.

## Data streams

- **Zone Traffic** - requests, bandwidth, cached traffic, threats, page views and cache hit ratio for a zone, hourly for timeframes up to two days and daily beyond.
- **Zone Traffic Breakdown** - requests, bytes and visits for a zone grouped by a dimension you choose (country, status code, cache status, host, device type, HTTP protocol or content type).
- **Zone Firewall Events** - firewall and WAF event counts for a zone by action, grouped by rule, service, country, host, user agent or path.
- **Zone Firewall Event Volume** - firewall and WAF event counts over time for a zone, optionally filtered by action and service, for up to 30 days on every plan.
- **Account Traffic** - requests, bandwidth and visits across every zone in an account in one query, grouped by zone, country, status code, cache status, host or device type.
- **Load Balancing Requests** - load balancer request counts for a zone by load balancer, pool, origin and edge location.
- **DNS Records** - every DNS record in a zone with type, content, TTL, proxy status and tags.
- **SSL Certificates** - certificate packs for a zone with issuer, validation method, expiry date and days until expiry.
- **Health Checks** - standalone health checks configured on a zone with status, address, interval and failure reason.
- **Worker Invocations** - requests, errors, subrequests and CPU-time percentiles for one Worker script.
- **Worker Subrequests** - outbound requests a Worker makes, with bytes and P50/P99 response time, grouped by host, cache status, status code or outcome.
- **Worker Cron Trigger Runs** - each scheduled run of a Worker with its schedule, outcome and CPU time, so a failing cron trigger is visible.
- **Worker Static Asset Requests** - requests served from a Worker's static assets, by status code, cache status or host.
- **Worker Cache Requests** - Cache API requests a Worker makes, by cache status.
- **Worker Smart Placement** - requests and duration for a Worker, split by whether Smart Placement ran it near its back end.
- **Workers Build Minutes** - Workers Builds minutes used by an account.
- **R2 Operations** - requests and response bytes against an R2 bucket by operation type and outcome.
- **R2 Storage** - stored object count, payload size, metadata size and upload count for an R2 bucket over time.
- **R2 Bandwidth** - bytes downloaded from and uploaded to an R2 bucket.
- **KV Operations** - request counts and latency percentiles for a KV namespace by operation type.
- **KV Storage** - stored key count and byte size for a KV namespace.
- **D1 Queries** - read and write query counts, rows read and written, response bytes and query-time percentiles for a D1 database.
- **D1 Storage** - stored size of a D1 database.
- **Queue Message Operations** - message write, read and delete operations on a queue with outcome, consumer type, lag time and retry count.
- **Queue Backlog** - average messages and bytes waiting in a queue over time.
- **Queue Delayed Backlog** - average delayed messages waiting in a queue.
- **Pages Deployments** - deployment history for a Pages project with environment, status, branch, commit and URL.
- **Tunnel Connections** - active connector connections for a Tunnel with edge location, origin IP, connector version and architecture.
- **Load Balancer Pool Health** - per-origin health, response code, response time and failure reason for a pool at each Cloudflare edge location.
- **Access Logins** - Zero Trust login attempts for an Access application by identity provider, country and outcome.
- **DNS Analytics** - authoritative DNS query volume and response time for a zone, grouped by query name, query type, response code or edge location.
- **Email Routing** - forwarded and rejected messages for a zone by action, status and rule.
- **DMARC Reports** - DMARC alignment for a zone by sending source, with pass rate and message volume.
- **Cache Reserve Operations** - read, write and delete operations against a zone's Cache Reserve.
- **Cache Reserve Storage** - bytes and object count held in a zone's Cache Reserve over time.
- **Health Check Events** - standalone health check results for a zone with status, region, failure reason and response time.
- **Network Error Logs** - browser-reported network errors for a zone by error type and edge location.
- **Page Shield Reports** - client-side scripts and resources observed on a zone.
- **Web Analytics Page Loads** - page views and visits for a zone's hostnames, grouped by country, device type or referrer.
- **Core Web Vitals** - P75 Largest Contentful Paint, Interaction to Next Paint and Cumulative Layout Shift for a zone's hostnames.
- **Web Analytics Page Load Timing** - P75 DNS, connection, request, response, first contentful paint and page load times for a zone's hostnames.
- **Gateway DNS Queries** - Zero Trust Gateway DNS resolutions for an account by policy decision, category, location or query type.
- **Gateway HTTP Requests** - Zero Trust Gateway proxied web requests for an account by action, host or category.
- **Gateway Network Sessions** - Zero Trust Gateway TCP and UDP sessions for an account by action, destination, protocol or device.
- **Workers AI Inference** - Workers AI inference requests for an account by model, with token counts and average duration.
- **Durable Object Invocations** - requests, errors and wall-time percentiles for a Durable Object namespace.
- **Durable Object Storage** - stored bytes for a SQLite-backed Durable Object namespace over time.
- **Vectorize Queries** - query volume and average latency for a Vectorize index.
- **Vectorize Storage** - stored vector count and dimensions for a Vectorize index.
- **Hyperdrive Queries** - query volume and average latency for a Hyperdrive configuration.
- **Hyperdrive Connection Pool** - pool size, free slots and waiting clients for a Hyperdrive configuration.
- **Gateway Network Sessions** - Zero Trust Gateway TCP and UDP sessions for an account by action, destination, protocol or device.
- **DNS Firewall Analytics** - DNS Firewall cluster query volume, response codes and processing time for an account.
- **Audit Logs** - account audit activity grouped by action, actor or resource type.
- **Images Requests** - Cloudflare Images request volume for an account.
- **Images Unique Transformations** - daily count of unique image transformations served for an account.
- **Pages Functions Invocations** - requests, errors and CPU time for the Pages Functions running in an account, by function.
- **Browser Rendering** - Browser Rendering session count and duration for an account.
- **Stream Minutes Viewed** - minutes viewed for a Cloudflare Stream video.
- **Stream Playback Quality** - playback buffering and bitrate for a Stream video, by country, resolution or stream type.
- **Realtime Usage** - ingress and egress bandwidth for a Realtime application by track type.
- **Turnstile Challenges** - challenges served by a Turnstile widget, by event type or action.
- **AI Gateway Requests** - requests, tokens, cost and duration through an AI Gateway, by model or provider.
- **AI Gateway Errors** - errored requests through an AI Gateway, by model or provider.
- **AI Gateway Cache** - cache hits and misses for an AI Gateway.
- **AutoRAG Queries** - AI Search query volume for an AutoRAG instance.
- **Container Metrics** - CPU, memory, uptime and network throughput for a container application.
- **Pipeline Ingestion** - records and bytes ingested by a pipeline.
- **Queue Consumer Metrics** - average consumer concurrency for a queue.
- **Durable Object Subrequests** - uncached subrequest body size for a Durable Object namespace.
- **Durable Object Activity** - active time, CPU time, storage operations, limit errors, peak memory and WebSocket connections for a Durable Object namespace.
- **D1 Query Insights** - query counts, rows touched and query duration percentiles for a D1 database.
- **GraphQL Query** - runs any query you write against Cloudflare's GraphQL Analytics API, for the many datasets this plugin has no dedicated stream for.

Twenty-four further streams back the import and the setup check and are hidden from the tile editor.

### Writing your own GraphQL queries

Cloudflare's GraphQL Analytics API exposes far more datasets than this plugin ships streams for. The **GraphQL Query** stream runs a query you write and shapes the result like any other stream. Its default query shows hourly traffic for the selected zone; edit it from there.

- **Zone or account** fills in the IDs a query needs. Select a zone and the query can use `$zoneTag`, `$zoneTags` (every selected zone, for `zoneTag_in`) and `$accountTag` (the zone's account); select an account and it can use `$accountTag`. On a zone or account perspective, bind the dashboard variable here and one tile works for every zone.
- The timeframe arrives as `$start` and `$end` (`Time!`, ISO 8601) and `$startDate` and `$endDate` (`Date!`, `YYYY-MM-DD`), so a query can filter with `datetime_geq: $start` or `date_geq: $startDate`. Declare only the variables the query uses.
- **Variables** adds your own as a JSON object, and overrides a built-in variable of the same name.
- **Path to rows** can usually stay empty: the stream uses the first array of rows in the response. Set it, for example to `data.viewer.zones.0.httpRequests1hGroups`, when a query reads several datasets or zones. A wrong path is reported with the array paths the response does contain.
- Nested fields become dotted columns, such as `sum.requests` and `dimensions.datetime`.
- Choose the **None** timeframe when the query hard-codes its own dates.

To find a dataset and its fields, browse Cloudflare's [GraphQL Analytics docs](https://developers.cloudflare.com/analytics/graphql-api/) or its guide to [exploring the schema](https://developers.cloudflare.com/analytics/graphql-api/getting-started/explore-graphql-schema/). The limits query under [Known limitations](#known-limitations) shows how far back and how wide each dataset can go on your plan.

## What gets indexed

| Object type | API source | Represents |
| ----------- | ---------- | ---------- |
| **Cloudflare Account** | `GET /accounts` | An account the API token can see. |
| **Cloudflare Zone** | `GET /zones` | A domain proxied through Cloudflare. |
| **Cloudflare Worker** | `GET /accounts/{id}/workers/scripts` | A deployed Worker script. |
| **Cloudflare R2 Bucket** | `GET /accounts/{id}/r2/buckets` | An R2 object storage bucket. |
| **Cloudflare Pages Project** | `GET /accounts/{id}/pages/projects` | A Cloudflare Pages project. |
| **Cloudflare D1 Database** | `GET /accounts/{id}/d1/database` | A D1 SQL database. |
| **Cloudflare KV Namespace** | `GET /accounts/{id}/storage/kv/namespaces` | A Workers KV namespace. |
| **Cloudflare Queue** | `GET /accounts/{id}/queues` | A Cloudflare Queue. |
| **Cloudflare Tunnel** | `GET /accounts/{id}/cfd_tunnel` | A `cloudflared` tunnel. |
| **Cloudflare Load Balancer Pool** | `GET /accounts/{id}/load_balancers/pools` | An origin pool used by load balancing. |
| **Cloudflare Access Application** | `GET /accounts/{id}/access/apps` | A Zero Trust Access application. |
| **Cloudflare Durable Object Namespace** | `GET /accounts/{id}/workers/durable_objects/namespaces` | A Durable Object namespace and the Worker class backing it. |
| **Cloudflare Vectorize Index** | `GET /accounts/{id}/vectorize/v2/indexes` | A Vectorize vector database index. |
| **Cloudflare Hyperdrive Config** | `GET /accounts/{id}/hyperdrive/configs` | A Hyperdrive database connection configuration. |
| **Cloudflare Worker Route** | `GET /zones/{id}/workers/routes` | A URL pattern routing a zone's requests to a Worker. |
| **Cloudflare Worker Binding** | `GET /accounts/{id}/workers/scripts/{name}/settings` | A resource bound to a Worker, such as a KV namespace or R2 bucket. |
| **Cloudflare Stream Video** | `GET /accounts/{id}/stream` | A video hosted on Cloudflare Stream. |
| **Cloudflare Turnstile Widget** | `GET /accounts/{id}/challenges/widgets` | A Turnstile challenge widget. |
| **Cloudflare AI Gateway** | `GET /accounts/{id}/ai-gateway/gateways` | An AI Gateway instance proxying model calls. |
| **Cloudflare AutoRAG** | `GET /accounts/{id}/autorag/rags` | An AutoRAG / AI Search instance. |
| **Cloudflare Container Application** | `GET /accounts/{id}/containers/applications` | A deployed container application. |
| **Cloudflare Pipeline** | `GET /accounts/{id}/pipelines` | A Cloudflare Pipelines data pipeline. |
| **Cloudflare Realtime App** | `GET /accounts/{id}/calls/apps` | A Cloudflare Realtime (Calls) application. |

**Relationships:** the plugin ships correlation rules that draw edges between imported objects:

| Relationship | How it matches |
| ------------ | -------------- |
| Every resource **belongs to** its Account | the resource's `accountId` against the account's id |
| Worker Binding **declared by** Worker, and **targets** the KV namespace / R2 bucket / D1 database / queue / Durable Object namespace / Vectorize index / Hyperdrive config it points at | the binding's target id against that resource's id |
| Worker Binding **calls** Worker | a service binding's target script name against the Worker name, within the same account |
| Worker **serves** Zone | through the Worker Route that names both |
| Worker Route **routes to** Worker, and **belongs to** Zone | the route's script name and zone id |
| Durable Object Namespace **implemented by** Worker | the namespace's script name against the Worker name, within the same account |
| Pages Project **served by** Zone | the project's first custom domain against the zone name |
| Queue **consumed by** Worker, and **receives messages from** Worker | the queue's first consumer and first producer script name against the Worker name, within the same account |
| Turnstile Widget **protects** Zone | the widget's first allowed domain against the zone name |
| Access Application **protects** Zone | the registrable domain derived from the app's hostname against the zone name |

Together these give a dependency graph: from a KV namespace you can see which Workers bind it, and from a Worker which zones it serves.

Rules that match on a name rather than an id also match on `accountId`. Cloudflare only guarantees a Worker, queue, bucket or index name is unique within an account, so a token that can read two accounts would otherwise draw edges between resources in one and a same-named Worker in the other.

Worker, R2 Bucket, Vectorize Index and Worker Binding identifiers are prefixed with the account id (`<accountId>:<name>`) because Cloudflare only guarantees those names are unique within an account. Every other type uses its own Cloudflare id.

## Known limitations

- **Access Applications only correlate to zones under a single-label suffix.** The rule derives the zone from the application's hostname by taking its last two labels, so `login.example.com` matches the zone `example.com`. Under a multi-label public suffix that is wrong - `login.example.co.uk` reduces to `co.uk`, which matches no zone, so the edge is not drawn. Correlation expressions have no public-suffix list to consult and Cloudflare does not return a zone id on the Access application, so applications on `.co.uk`, `.com.au` and similar domains are left unrelated rather than related to the wrong zone.

- **One-to-many relationships only correlate on their first value.** The import serialises an array-valued property to a JSON string (`["a.com","b.com"]`) rather than storing it as a multi-valued property, and correlation conditions only offer `equals`, so an array can never match a scalar. Where a Cloudflare object names several others - a Turnstile widget's allowed domains, a Pages project's custom domains, a queue's consumers and producers - the plugin stores the full list as a readable string for display and a separate `primary*` property holding the first entry, and correlates on that. A widget covering three zones therefore draws an edge to one of them. The same constraint is why Kubernetes, the only other plugin here shipping correlation rules, joins on `primaryBackendServiceName` rather than the full backend list.

- **Analytics timeframes are capped per dataset and per plan.** Cloudflare's GraphQL Analytics API limits both how wide a single query can be and how far back it can reach, and the limits differ for every dataset. Each stream offers the timeframes its dataset allows. These limits were read from Cloudflare's own `settings` API for a Pro and a Free zone and confirmed by querying each stream at every offered timeframe:

    | Widest query / history kept | Data streams | Longest timeframe offered |
    | --------------------------- | ------------ | ------------------------- |
    | **1 day / 3 days** on Pro; none on Free | Zone Firewall Events | Last 24 hours (Last 7 and 30 days on higher plans - see below) |
    | **30 days / 31 days** on every plan | Zone Firewall Event Volume | Last 30 days |
    | **3 days / 3 days** | Health Check Events, Load Balancing Requests | Last 24 hours |
    | **7 days** | Access Logins, Network Error Logs, Page Shield Reports, Worker Cron Trigger Runs | Last 7 days |
    | **7 days** on Free; **30 days** on Enterprise | Turnstile Challenges | Last 7 days (Last 30 days on Enterprise Turnstile) |
    | **30-31 days / 31 days** | Gateway HTTP Requests and Network Sessions, Stream Playback Quality, DNS Analytics, Zone Traffic Breakdown | Last 30 days |
    | **31-32 days / 31-32 days** | Gateway DNS Queries, Email Routing, DMARC Reports, Images Requests, AI Gateway Cache and Errors, AutoRAG, Browser Rendering, Container Metrics, Hyperdrive, Queue Consumer Metrics, Realtime Usage, Vectorize, Workers AI, Account Traffic, Worker Static Asset Requests, Worker Smart Placement, Workers Build Minutes, Hyperdrive Connection Pool, R2 Bandwidth | This month |
    | **32-62 days / 62-92 days** | Worker Invocations, Pages Functions, KV, D1, R2, Durable Objects, Queue Backlog and Message Operations, Pipeline Ingestion, Cache Reserve, AI Gateway Requests, DNS Firewall Analytics, Stream Minutes Viewed, Worker Subrequests, Worker Cache Requests, Queue Delayed Backlog, Durable Object Activity | Last month |
    | **61 days, daily only** | Images Unique Transformations | This month |
    | **93 days / 184 days** | Web Analytics Page Loads, Core Web Vitals, Web Analytics Page Load Timing | This quarter |
    | **180 days / 540 days** | Audit Logs | Last quarter |
    | **365 days, daily** | Zone Traffic (hourly up to two days, then daily) | This year |

    *This month*, *This quarter* and *This year* end in the future; Cloudflare counts only the part that has elapsed, so they fit a cap the full period would not. Where a cap is exactly as wide as a timeframe - a 7-day cap and Last 7 days - the query starts one minute late, because Cloudflare measures the range up to the moment it receives the query and would otherwise reject it by the request's latency.

    Limits can be wider on Business and Enterprise plans. Two streams offer timeframes that only higher plans can serve, and on a plan whose limit is shorter the tile shows an error naming that limit rather than empty data:

    - **Zone Firewall Events** offers Last 7 days and Last 30 days. Its grouped dataset, `firewallEventsAdaptiveGroups`, allows 1 day on Pro and is not available on Free. Cloudflare publishes 30-31 day limits for Security Events, but [those apply to the raw event dataset](https://developers.cloudflare.com/waf/analytics/security-events/#limits), which returns individual events rather than counts. Use **Zone Firewall Event Volume** for longer ranges: its dataset counts every event for up to 30 days on every plan, including Free, but can only filter by action and service rather than break down by them.
    - **Turnstile Challenges** offers Last 30 days, which [Cloudflare documents](https://developers.cloudflare.com/turnstile/plans/) as the Enterprise lookback; Free is limited to 7 days.

    To see the limits for your own account, run this in the **GraphQL Query** stream with the **None** timeframe, a `zoneTag` in **Variables**, and **Path to rows** set to `data.viewer.zones`:

    ```graphql
    query ($zoneTag: string!) {
      viewer {
        zones(filter: { zoneTag: $zoneTag }) {
          settings {
            firewallEventsAdaptiveGroups { maxDuration notOlderThan }
          }
        }
      }
    }
    ```

    `maxDuration` and `notOlderThan` are in seconds; swap in any other dataset name, or query `accounts(filter: { accountTag: $accountTag })` for account-level datasets.

- **Time buckets follow the timeframe.** Time-series streams return one row per minute for Last hour, per 5 minutes up to 12 hours, per 15 minutes up to a day, hourly up to a week, then six-hourly or hourly up to a month (daily for R2 Operations) and daily beyond. Streams grouped by a dimension you choose, which can have many values, use coarser buckets to stay inside Cloudflare's row cap: 5 minutes for Last hour, 15 minutes up to 12 hours, hourly up to a day and daily beyond. A tile can aggregate these into coarser buckets but never finer ones.
- **R2 must be activated before it returns anything.** If R2 has never been enabled in the Cloudflare dashboard, the import step for R2 buckets fails with *"Please enable R2 through the Cloudflare Dashboard"*. The step is optional, so the rest of the import still succeeds - but no R2 objects or metrics appear.
- **Zero Trust Access must be enabled** for the Access application import to work; otherwise Cloudflare returns *"Access is not enabled"*.
- **Web Analytics must be enabled per zone.** The RUM datasets are account-scoped and filtered to the zone's own hostname and its subdomains, so a zone without the Web Analytics beacon installed returns nothing even though the query succeeds. Traffic from hosts that are not Cloudflare zones is not reachable from a zone-scoped tile.
- **Zero Trust Gateway must be configured** for the Gateway streams to return anything. The datasets are reachable without a Gateway subscription, so an empty result means no proxied traffic rather than a permissions problem.
- **Durable Object storage covers SQLite-backed namespaces only.** Cloudflare's account-wide storage dataset cannot be filtered per namespace, so the plugin uses the SQLite storage dataset, which can. Key-value-backed namespaces report no storage.
- **Load balancing analytics is gated per zone**, not per account. Zones without the Load Balancing add-on return an authorization error rather than empty data.
- **Pages endpoints cap page size at 10.** Cloudflare rejects any larger `per_page` on the Pages API, so Pages projects and deployments are fetched ten at a time.
- **Some resource lists are not paged.** R2 buckets, D1 databases, Queues, load balancer pools, Access applications, Vectorize indexes, Hyperdrive configs, Worker scripts and Worker routes are imported in a single request each. Where Cloudflare's paging behaviour could be proven against real data it is used (zones, accounts, DNS records, Pages projects, KV namespaces, Tunnels and Durable Object namespaces all page); the rest were left unpaged because the endpoint either ignores the paging parameters outright — as `workers/scripts` does — or holds too few records in the tested account to confirm they are honoured. If an account holds more of one of these than Cloudflare returns on a single page, the remainder is not imported.
- **Rate limits.** The REST API allowed 1,200 requests per 300 seconds on the token tested. GraphQL queries are by default limited to 300 per 5 minutes per token, so the plugin opts into Cloudflare's [account-based rate limiting](https://developers.cloudflare.com/analytics/graphql-api/account-based-rate-limiting/), which gives each account and each zone its own 300-per-5-minutes budget instead. Every analytics stream issues one request per selected object, so a tile scoped to hundreds of objects can still reach a per-account limit. Cloudflare documents that account-based limiting does not support a query listing several zones at the top level of `viewer`; such queries worked in testing, but if Cloudflare starts rejecting one in the **GraphQL Query** stream, nest the zones inside `accounts(filter: { accountTag: $accountTag })`.
- **Results with very many rows are truncated.** Cloudflare caps a GraphQL result at 10,000 rows (5,000 on some streams here). The time buckets above keep most time-series streams well inside it, but a stream with many distinct values can still exceed it: a breakdown such as DNS Analytics by query name on a busy zone, or Browser Rendering, which reports each session separately. Those streams order by count, so the rows dropped are the least frequent values rather than the most recent part of the range.

- **Hand-written GraphQL queries are unbounded.** The **GraphQL Query** stream runs whatever you give it, so it can hit limits the built-in streams are tuned to avoid: a large `limit` on a multi-dimension dataset can exceed the ~6 MB response cap, and a timeframe wider than that dataset's own cap fails with Cloudflare's error naming the limit. Prefer the pre-aggregated `*Groups` datasets over raw event datasets, and keep `limit` modest. The stream does not page, so your `limit` is the ceiling.
- **Some analytics are only available on paid plans.** Page Shield and Network Error Logs return an authorization error on plans without them; Cache Reserve, Load Balancing and Health Checks are add-ons. A tile for a feature the zone or account is not entitled to shows Cloudflare's authorization error rather than empty data.
- **Account Traffic shows zones it cannot name by their zone tag.** The stream resolves each zone tag to an imported zone's name. Traffic for a zone the token cannot list - for example one outside the token's zone resources - appears as *Object not found: Cloudflare Zone/&lt;tag&gt;*.
- **Tunnel bandwidth is not available.** Cloudflare exposes `cloudflared` traffic metrics from each connector's local metrics endpoint rather than through the API, so Tunnels show connector health only.
- **Costs are unitless.** Cloudflare's AI Gateway analytics reports cost without stating a currency, so the plugin shows a plain number rather than assuming one.
- **Pages Functions cannot be scoped to a single project.** Cloudflare identifies Pages Functions by an internal script name with no published mapping to the project, so this stream reports all Pages Functions in the account, with the function name as a column.
- **Imports run every 12 hours** by default, so newly created zones and resources are not visible immediately.
- **Read-only.** The plugin never creates, modifies or deletes anything in Cloudflare.
