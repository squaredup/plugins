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

<!-- finalized in Phase 9 -->

## Data streams

<!-- finalized in Phase 9 -->

## What gets indexed

<!-- finalized in Phase 9 -->

## Known limitations

<!-- finalized in Phase 9 -->
