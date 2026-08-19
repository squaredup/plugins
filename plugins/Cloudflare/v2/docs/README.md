Monitor your [Cloudflare](https://www.cloudflare.com) account in SquaredUp - zone traffic and cache performance, firewall and WAF activity, DNS records and SSL certificate expiry, plus the developer platform: Workers, R2, KV, D1, Queues, Pages, Tunnels, Load Balancers and Access applications. Data comes from the [Cloudflare REST API](https://developers.cloudflare.com/api/) and the [GraphQL Analytics API](https://developers.cloudflare.com/analytics/graphql-api/).

> ⚠️ This plugin is **read-only** and never changes anything in your Cloudflare account. It does not cover Logpush, Magic Transit, Magic WAN, Spectrum, Stream, Images, Turnstile or Waiting Room.

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

- **Zone Traffic** - hourly requests, bandwidth, cached traffic, threats, page views and cache hit ratio for a zone.
- **Zone Traffic Breakdown** - requests, bytes and visits for a zone grouped by a dimension you choose (country, status code, cache status, host, device type, HTTP protocol or content type).
- **Zone Firewall Events** - firewall and WAF event counts for a zone by action, grouped by rule, service, country, host, user agent or path.
- **Load Balancing Requests** - load balancer request counts for a zone by load balancer, pool, origin and edge location.
- **DNS Records** - every DNS record in a zone with type, content, TTL, proxy status and tags.
- **SSL Certificates** - certificate packs for a zone with issuer, validation method, expiry date and days until expiry.
- **Health Checks** - standalone health checks configured on a zone with status, address, interval and failure reason.
- **Worker Invocations** - requests, errors, subrequests and CPU-time percentiles for one Worker script.
- **R2 Operations** - requests and response bytes against an R2 bucket by operation type and outcome.
- **R2 Storage** - stored object count, payload size, metadata size and upload count for an R2 bucket over time.
- **KV Operations** - daily request counts and latency percentiles for a KV namespace by operation type.
- **KV Storage** - daily stored key count and byte size for a KV namespace.
- **D1 Queries** - daily read and write query counts, rows read and written, response bytes and query-time percentiles for a D1 database.
- **D1 Storage** - daily stored size of a D1 database.
- **Queue Message Operations** - message write, read and delete operations on a queue with outcome, consumer type, lag time and retry count.
- **Queue Backlog** - average messages and bytes waiting in a queue over time.
- **Pages Deployments** - deployment history for a Pages project with environment, status, branch, commit and URL.
- **Tunnel Connections** - active connector connections for a Tunnel with edge location, origin IP, connector version and architecture.
- **Load Balancer Pool Health** - per-origin health, response code, response time and failure reason for a pool at each Cloudflare edge location.
- **Access Logins** - daily Zero Trust login attempts for an Access application by identity provider, country and outcome.
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
- **Gateway DNS Queries** - Zero Trust Gateway DNS resolutions for an account by policy decision, category, location or query type.
- **Gateway HTTP Requests** - Zero Trust Gateway proxied web requests for an account by action, host or category.
- **Gateway Network Sessions** - Zero Trust Gateway TCP and UDP sessions for an account by action, destination, protocol or device.
- **Workers AI Inference** - Workers AI inference requests for an account by model, with token counts and average duration.
- **Durable Object Invocations** - requests, errors and wall-time percentiles for a Durable Object namespace.
- **Durable Object Storage** - stored bytes for a SQLite-backed Durable Object namespace over time.
- **Vectorize Queries** - query volume and average latency for a Vectorize index.
- **Vectorize Storage** - stored vector count and dimensions for a Vectorize index.
- **Hyperdrive Queries** - query volume and average latency for a Hyperdrive configuration.
- **Gateway Network Sessions** - Zero Trust Gateway TCP and UDP sessions for an account by action, destination, protocol or device.
- **DNS Firewall Analytics** - DNS Firewall cluster query volume, response codes and processing time for an account.
- **Audit Logs** - account audit activity grouped by action, actor or resource type.
- **Images Requests** - Cloudflare Images request volume for an account.
- **Images Unique Transformations** - daily count of unique image transformations served for an account.
- **Pages Functions Invocations** - requests, errors and CPU time for the Pages Functions running in an account, by function.
- **Browser Rendering** - Browser Rendering session count and duration for an account.
- **Stream Minutes Viewed** - daily minutes viewed for a Cloudflare Stream video.
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
- **D1 Query Insights** - query counts, rows touched and query duration percentiles for a D1 database.
- **GraphQL Query** - runs any query you write against Cloudflare's GraphQL Analytics API, for the many datasets this plugin has no dedicated stream for.

Twenty-four further streams back the import and the setup check and are hidden from the tile editor.

### Writing your own GraphQL queries

Cloudflare's GraphQL Analytics API exposes far more datasets than this plugin ships streams for. The **GraphQL Query** stream is an escape hatch: paste a query, tell it where the rows live, and it shapes the result like any other stream.

- `start` and `end` (ISO 8601) and `startDate` and `endDate` (`YYYY-MM-DD`) are supplied automatically from the tile's timeframe, so a query can filter with `datetime_geq: $start` or `date_geq: $startDate` without hardcoding dates.
- Anything you put in **Variables** is merged on top, which is how you supply an `accountTag` or `zoneTag` - the plugin config holds neither.
- **Path to data** points at the array of rows, e.g. `data.viewer.zones.0.httpRequests1hGroups`. Get it wrong and the error lists the array paths the response actually contains.
- Choose the **None** timeframe when your query hardcodes its own date filter.

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
| Worker **serves** Zone | through the Worker Route that names both |
| Pages Project **served by** Zone | the project's custom domains against the zone name |
| Queue **consumed by** Worker | the queue's consumer script names against the Worker name |

Together these give a dependency graph: from a KV namespace you can see which Workers bind it, and from a Worker which zones it serves.

Worker, R2 Bucket, Vectorize Index and Worker Binding identifiers are prefixed with the account id (`<accountId>:<name>`) because Cloudflare only guarantees those names are unique within an account. Every other type uses its own Cloudflare id.

## Known limitations

- **Analytics timeframes are capped per dataset, and the caps are short.** Cloudflare's GraphQL Analytics API limits how wide a single query's time range can be, and the limit differs for every dataset. These were measured against a Pro-plan account:

    | Widest single query | Data streams |
    | ------------------- | ------------ |
    | **1 day** | Zone Firewall Events |
    | **~3 days** | Zone Traffic, Load Balancing Requests, Health Check Events |
    | **~1 week** | DNS Analytics, Access Logins, Turnstile Challenges |
    | **8 days** | Zone Traffic Breakdown |
    | **~30-32 days** | the Gateway streams, KV, D1, R2, Queues, Workers AI, Durable Objects, Vectorize, Hyperdrive, Cache Reserve, Email Routing, DMARC, Images, AI Gateway, AutoRAG, Containers, Pipelines, Realtime, Browser Rendering, Stream |
    | **~93 days** | Web Analytics Page Loads, Core Web Vitals |
    | **~179 days** | Audit Logs |

    Every one of these was measured against the live API by widening the range until Cloudflare rejected it - none is documented. Caps may differ on other plans, and a few sit so close to a boundary that the next-widest option had to be dropped.

    Longer ranges are not offered because Cloudflare rejects them outright. Caps may differ on Free, Business and Enterprise plans.

- **Daily-granularity datasets have no intraday view.** KV, D1 and Access analytics are aggregated by day, so their shortest timeframe is Last 7 days.
- **R2 must be activated before it returns anything.** If R2 has never been enabled in the Cloudflare dashboard, the import step for R2 buckets fails with *"Please enable R2 through the Cloudflare Dashboard"*. The step is optional, so the rest of the import still succeeds - but no R2 objects or metrics appear.
- **Zero Trust Access must be enabled** for the Access application import to work; otherwise Cloudflare returns *"Access is not enabled"*.
- **Web Analytics must be enabled per zone.** The RUM datasets are account-scoped and filtered to a zone by hostname, so a zone without the Web Analytics beacon installed returns nothing even though the query succeeds. Traffic from hosts that are not Cloudflare zones is not reachable from a zone-scoped tile.
- **Zero Trust Gateway must be configured** for the Gateway streams to return anything. The datasets are reachable without a Gateway subscription, so an empty result means no proxied traffic rather than a permissions problem.
- **Durable Object storage covers SQLite-backed namespaces only.** Cloudflare's account-wide storage dataset cannot be filtered per namespace, so the plugin uses the SQLite storage dataset, which can. Key-value-backed namespaces report no storage.
- **Load balancing analytics is gated per zone**, not per account. Zones without the Load Balancing add-on return an authorization error rather than empty data.
- **Pages endpoints cap page size at 10.** Cloudflare rejects any larger `per_page` on the Pages API, so Pages projects and deployments are fetched ten at a time.
- **Some resource lists are not paged.** R2 buckets, D1 databases, Queues, load balancer pools, Access applications, Vectorize indexes, Hyperdrive configs, Worker scripts and Worker routes are imported in a single request each. Where Cloudflare's paging behaviour could be proven against real data it is used (zones, accounts, DNS records, Pages projects, KV namespaces, Tunnels and Durable Object namespaces all page); the rest were left unpaged because the endpoint either ignores the paging parameters outright — as `workers/scripts` does — or holds too few records in the tested account to confirm they are honoured. If an account holds more of one of these than Cloudflare returns on a single page, the remainder is not imported.
- **Rate limits.** The REST API allowed 1,200 requests per 300 seconds on the token tested, and Cloudflare documents a separate limit of 300 GraphQL queries per 5 minutes. Every analytics stream issues one request per selected object, so very large estates can hit these limits.
- **Hand-written GraphQL queries are unbounded.** The **GraphQL Query** stream runs whatever you give it, so it can hit limits the built-in streams are tuned to avoid: a large `limit` on a multi-dimension dataset can exceed the ~6 MB response cap, and a timeframe wider than that dataset's own cap fails outright. Prefer the pre-aggregated `*Groups` datasets over raw event datasets, and keep `limit` modest. The stream does not page, so your `limit` is the ceiling.
- **Some analytics are only available on paid plans.** Page Shield and Network Error Logs return an authorization error on plans without them; Cache Reserve, Load Balancing and Health Checks are add-ons. An unentitled feature shows no data rather than an error in most tiles.
- **A failed Cloudflare query can look like "no data".** Cloudflare answers a failed GraphQL query with HTTP 200 and an `errors` array, which the platform does not treat as a failure. Streams that use a post-request script raise these errors explicitly, but the simpler declarative streams will show an empty tile instead of an error message.
- **Costs are unitless.** Cloudflare's AI Gateway analytics reports cost without stating a currency, so the plugin shows a plain number rather than assuming one.
- **Pages Functions cannot be scoped to a single project.** Cloudflare identifies Pages Functions by an internal script name with no published mapping to the project, so this stream reports all Pages Functions in the account, with the function name as a column.
- **The first import only populates accounts and zones.** Everything below them - Workers, KV namespaces, queues, tunnels, Stream videos, Turnstile widgets and the rest - is imported by steps that run against the accounts and zones the same import has just created, and on a brand new data source those objects are not yet visible when those steps start. They are skipped with a warning, and the **next import picks them all up**. Trigger a re-import from the data source page after adding the plugin rather than waiting for the scheduled one.
- **Imports run every 12 hours** by default, so newly created zones and resources are not visible immediately.
- **Read-only.** The plugin never creates, modifies or deletes anything in Cloudflare.
