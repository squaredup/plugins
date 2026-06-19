## What this plugin monitors

Monitor your [Algolia](https://www.algolia.com/) search application from SquaredUp. This plugin imports your Algolia **indices** as objects and provides dashboards covering index size and growth, search volume, and search quality (no-result rate, top searches).

- **Indices** — every index in your Algolia application is imported as an object, with its record count, data/file size, last build time and pending-task count.
- **Search analytics** (per index) — search volume over time, the no-results rate, your most popular searches, and the searches that returned no results.

Out of the box you get an **Overview** dashboard (totals and top indices across the whole application) and an **Index** perspective (per-index size, search volume, and search-quality tiles).

## Prerequisites — getting your credentials

You need two values from the Algolia dashboard: your **Application ID** and an **API key**.

1. Sign in to the [Algolia dashboard](https://dashboard.algolia.com/).
2. Go to **Settings → API Keys** (or **Account → API Keys**).
3. Copy your **Application ID** (shown at the top of the API Keys page — a short string like `LIxxxxxxxx`).
4. For the API key, use your **Admin API Key**, **or** (recommended) create a dedicated key with only the permissions this plugin needs. Click **All API keys → New API Key** and grant these ACLs:
    - `listIndexes` — to import your indices
    - `settings` — to read index configuration
    - `analytics` — to read Search Analytics
    - Leave **Indices** set to _all_ (or restrict to the indices you want to monitor).

    A read-only **Search-Only API Key** is **not** sufficient — it lacks `listIndexes` and `analytics`.

> **Tip:** Using a scoped custom key rather than your Admin key follows least-privilege best practice and means the key can be rotated without affecting other integrations.

## Configuration fields

| Field                | Required            | What it is / where to find it                                                                                                                                                                             |
| -------------------- | ------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Application ID**   | Yes                 | Your Algolia Application ID, from **Settings → API Keys** in the Algolia dashboard. Also forms your API host (`https://<ApplicationID>.algolia.net`).                                                     |
| **API Key**          | Yes                 | An Admin key, or a custom key with the `listIndexes`, `settings` and `analytics` ACLs (see above). Stored encrypted.                                                                                      |
| **Analytics region** | No (default **US**) | The region your Algolia app's analytics data is stored in. Choose **EU** only if your application was created in Algolia's EU (Germany) region — otherwise analytics tiles will be empty. Defaults to US. |

## What gets indexed

| Object type | Represents                                | Key properties                                                                                                                                       |
| ----------- | ----------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Index**   | A single search index in your application | Records (entries), data size, file size, last build time (s), number of pending tasks, pending-task flag, last updated, primary index (for replicas) |

Each index's object ID is its index name, which is unique within an application.

## Known limitations

- **Search Analytics only.** This version covers the Search and Search Analytics APIs. It does **not** include the **Usage API** (operations/records time series) or the **Monitoring API** (latency, indexing time, infrastructure metrics) — those require an Algolia **Premium/Enterprise** plan and dedicated Usage/Monitoring API keys.
- **Analytics granularity is daily.** Algolia's Search Analytics aggregates per calendar day, so the analytics tiles use timeframes of **7 days and longer**. Shorter timeframes (e.g. last hour) are not meaningful for this data.
- **Analytics need search traffic.** Indices with no recent search activity will show empty analytics tiles — this is expected, not an error.
- **Analytics region matters.** If your app is in Algolia's EU region but the plugin is left on the US analytics region (or vice-versa), analytics calls succeed but return no data. Set the **Analytics region** field to match your app.
- **Rate limits.** The Analytics API is limited to ~100 requests/minute per application; very large numbers of indices on a single dashboard may be throttled.
- **`listIndexes` required.** If you authenticate with a Search-Only key, setup validation will fail because the key cannot list indices.
