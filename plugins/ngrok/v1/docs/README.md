Monitor your [ngrok](https://ngrok.com) account in SquaredUp: endpoints, connected agents, reserved domains, reserved TCP addresses, and TLS certificates, including certificate expiry and certificate provisioning health. Data comes from the [ngrok API](https://ngrok.com/docs/api/).

## Setup

1. Sign in to the [ngrok dashboard](https://dashboard.ngrok.com).
2. Go to **API Keys** ([dashboard.ngrok.com/api-keys](https://dashboard.ngrok.com/api-keys)) and select **New API Key**.
3. Optionally give the key a description (for example `SquaredUp`), and choose an owner with access to the resources you want to monitor.
4. Copy the key. ngrok shows it only once.
5. In SquaredUp, paste the key into the **API key** field and save.

> ⚠️ Use an **API key**, not an agent **authtoken**. Authtokens start ngrok agents and cannot call the ngrok API.

## Configuration fields

| Field | What it is | Where to find it | Required |
| ----- | ---------- | ---------------- | -------- |
| **API key** | An ngrok API key, sent as a bearer token | ngrok dashboard → **API Keys** | Yes |

When you save, SquaredUp makes a lightweight call to the ngrok API to confirm the key works. If that fails, check that you pasted an API key (not an authtoken) and that it hasn't been deleted.

## What this plugin monitors

- **Endpoints**: every online endpoint (agent, cloud and edge), with its URL, protocol, bindings, upstream, pooling, and whether it uses a Traffic Policy or the AI Gateway
- **Agents**: ngrok agents currently connected, with agent version, OS, IP address, region and uptime
- **Domains and certificates**: reserved domains and their certificate management status (provisioning errors such as DNS problems, renewal dates), TLS certificates and certificate authorities with days until expiry
- **Reserved TCP addresses**
- **Traffic identities**: users who have signed in to endpoints protected by OAuth, OIDC or SAML, and when they were last active
- **Log exporting**: event subscriptions and the destinations they export to

Out-of-the-box dashboards: **Overview**, plus **Endpoint**, **Reserved Domain** and **TLS Certificate** perspectives.

## Data streams

- **Endpoints**: online endpoints with type, protocol, bindings, upstream URL and Traffic Policy/AI Gateway flags (account-wide, or filtered to selected endpoints)
- **Agent Sessions**: connected ngrok agents with version, OS, IP, region and uptime (account-wide)
- **Reserved Domains**: reserved domains with certificate source, renewal date, provisioning error and a certificate status health state (account-wide, or filtered to selected domains)
- **TLS Certificates**: certificates with issuer, validity dates, days until expiry and an expiry status health state (account-wide, or filtered to selected certificates)
- **Reserved Addresses**: reserved TCP addresses with region and description (account-wide, or filtered to selected addresses)
- **Certificate Authorities**: mutual TLS certificate authorities with days until expiry and an expiry status health state (account-wide)
- **Traffic Identities**: users who have signed in through an endpoint's OAuth, OIDC or SAML policy, with identity provider and last activity (account-wide)
- **Event Subscriptions**: log export subscriptions with the event types they export and how many destinations they use (account-wide)
- **Event Destinations**: log export destinations with the target service (Datadog, CloudWatch Logs, Kinesis, Firehose or Azure Monitor Logs) and location. Credentials are never returned (account-wide)

Certificate and expiry health states: **Expired** and **Expires within 7 days** are errors, and **Expires within 30 days** is a warning. A domain certificate with a DNS or provisioning error is an error, and one that is still provisioning or overdue for renewal is a warning.

## What gets indexed

| Object type | API source | Represents |
| ----------- | ---------- | ---------- |
| Endpoint | `GET /endpoints` | An online ngrok endpoint (agent, cloud or edge) |
| Reserved Domain | `GET /reserved_domains` | A domain reserved in the account, including ngrok dev domains |
| TLS Certificate | `GET /tls_certificates` | An uploaded or automatically issued TLS certificate |
| Reserved Address | `GET /reserved_addrs` | A reserved TCP address |

**Relationships:** endpoints carry the ID of their reserved domain (`domainId`) and agent session (`agentSessionId`), and reserved domains carry the ID of their uploaded certificate (`certificateId`).

## Known limitations

- **No traffic, usage or cost metrics.** The ngrok API does not expose request counts, data transfer, latency, Traffic Inspector data, billing, or any AI Gateway usage (providers, models, cost). To chart traffic, set up **Log Exporting** in the ngrok dashboard to send `http_request_complete` events to Datadog, Amazon CloudWatch Logs, Amazon Kinesis or Azure Monitor Logs, and use the matching SquaredUp data source.
- **Current state only.** No data stream supports a timeframe; each returns the current state.
- **Agent endpoints are short-lived.** An agent endpoint exists only while its agent is running and gets a new ID each time the agent restarts. Indexed endpoints are refreshed on each import (every 12 hours by default), so the **Endpoints** stream is always more current than the indexed objects. Cloud endpoints are long-lived and index well.
- **Agents are not indexed.** Agent sessions change too often to import, so they are only available through the **Agent Sessions** stream.
- **Edges are not covered separately.** ngrok deprecated Edges, Routes, Backends and labeled tunnels on 31 December 2025. Edge-type endpoints still appear in **Endpoints**.
- **Rate limit.** The ngrok API allows 120 requests per minute per account. Each tile makes one request per 100 rows.
- **Read-only.** The plugin only reads from the ngrok API and never changes anything in your ngrok account.
