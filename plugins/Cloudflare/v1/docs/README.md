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
- **Developer platform** - Worker invocations, errors, subrequests and CPU-time percentiles; R2 bucket operations and stored size; KV operations, latency and stored keys; D1 query counts, rows touched and database size; Queue message operations and backlog; and Pages deployment history with branch and commit.
- **Zero Trust** - Access application inventory, Tunnel connector health, and daily Access login attempts by identity provider and country.

The out-of-the-box dashboards include a **Cloudflare Overview** plus a perspective for each of the eleven indexed object types.

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
- **GraphQL Query** - runs any query you write against Cloudflare's GraphQL Analytics API, for the many datasets this plugin has no dedicated stream for.

Twelve further streams back the import and the setup check and are hidden from the tile editor.

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

**Relationships:** every object except **Cloudflare Account** carries an `accountId` property identifying its owning account, and **Cloudflare Zone** additionally carries `accountName` and `planName`. These are stored as properties rather than graph links, so you can filter and group by account but the objects are not connected by edges.

Worker and R2 Bucket identifiers are prefixed with the account id (`<accountId>:<name>`) because Cloudflare only guarantees those names are unique within an account. Every other type uses its own Cloudflare id.

## Known limitations

- **Analytics timeframes are capped per dataset, and the caps are short.** Cloudflare's GraphQL Analytics API limits how wide a single query's time range can be, and the limit differs for every dataset. These were measured against a Pro-plan account:

    | Data stream | Widest single query | Timeframes offered |
    | ----------- | ------------------- | ------------------ |
    | **Zone Traffic** | 3 days | Last 12 hours, Last 24 hours |
    | **Zone Firewall Events** | 1 day | Last 12 hours, Last 24 hours |
    | **Load Balancing Requests** | ~3 days | Last 12 hours, Last 24 hours |
    | **Zone Traffic Breakdown** | 8 days | Last 12 hours, Last 24 hours, Last 7 days |
    | **Access Logins** | 1 week | Last 7 days |
    | **KV Operations / KV Storage** | ~32 days | Last 7 days, Last 30 days |
    | **Worker Invocations**, **R2**, **D1**, **Queue** streams | 30 days or more | up to Last 30 days |

    Longer ranges are not offered because Cloudflare rejects them outright. Caps may differ on Free, Business and Enterprise plans.

- **Daily-granularity datasets have no intraday view.** KV, D1 and Access analytics are aggregated by day, so their shortest timeframe is Last 7 days.
- **R2 must be activated before it returns anything.** If R2 has never been enabled in the Cloudflare dashboard, the import step for R2 buckets fails with *"Please enable R2 through the Cloudflare Dashboard"*. The step is optional, so the rest of the import still succeeds - but no R2 objects or metrics appear.
- **Zero Trust Access must be enabled** for the Access application import to work; otherwise Cloudflare returns *"Access is not enabled"*.
- **Load balancing analytics is gated per zone**, not per account. Zones without the Load Balancing add-on return an authorization error rather than empty data.
- **Pages endpoints cap page size at 10.** Cloudflare rejects any larger `per_page` on the Pages API, so Pages projects and deployments are fetched ten at a time.
- **Some resource lists are not paged.** R2 buckets, D1 databases, KV namespaces, Queues, Tunnels, load balancer pools and Access applications are imported in a single request each. If an account holds more of one of these than Cloudflare returns on one page, the remainder is not imported.
- **Rate limits.** The REST API allowed 1,200 requests per 300 seconds on the token tested, and Cloudflare documents a separate limit of 300 GraphQL queries per 5 minutes. Every analytics stream issues one request per selected object, so very large estates can hit these limits.
- **Hand-written GraphQL queries are unbounded.** The **GraphQL Query** stream runs whatever you give it, so it can hit limits the built-in streams are tuned to avoid: a large `limit` on a multi-dimension dataset can exceed the ~6 MB response cap, and a timeframe wider than that dataset's own cap fails outright. Prefer the pre-aggregated `*Groups` datasets over raw event datasets, and keep `limit` modest. The stream does not page, so your `limit` is the ceiling.
- **Imports run every 12 hours** by default, so newly created zones and resources are not visible immediately.
- **Read-only.** The plugin never creates, modifies or deletes anything in Cloudflare.
