# Typesense

Query documents from your [Typesense](https://typesense.org) collections directly in SquaredUp. This plugin runs searches against a Typesense Cloud (or self-hosted) instance and returns matching documents as rows you can chart, table, and build dashboards from.

It is designed to work with a **search-only API key**, so it never needs admin access to your cluster.

## What this plugin does

- Runs structured searches against a single collection and returns one row per matching document.
- Runs raw `multi_search` queries from a JSON blob for federated / multi-collection / advanced queries.
- Returns search result counts (matching documents, total documents scanned, timing).

Because a search-only key cannot list collections (`collections:list` requires an admin key), this plugin does **not** import your collections or documents as objects into the SquaredUp graph. You choose the collection to query in the plugin configuration.

## Prerequisites — getting a search API key

1. Log in to the [Typesense Cloud dashboard](https://cloud.typesense.org) (or your self-hosted admin tooling).
2. Note your cluster's **nodes hostname** — it looks like `xxxxxxxxx.a1.typesense.net`. Your base URL is `https://<that-host>`.
3. Create a **search-only API key**:
   - Using an admin key, call the [Create API Key](https://typesense.org/docs/latest/api/api-keys.html) endpoint with the `documents:search` action, scoped to the collection(s) you want to expose. Example:

     ```bash
     curl "https://<host>/keys" \
       -X POST \
       -H "X-TYPESENSE-API-KEY: <ADMIN_KEY>" \
       -H "Content-Type: application/json" \
       -d '{"description":"SquaredUp search key","actions":["documents:search"],"collections":["<your-collection>"]}'
     ```

   - Copy the returned `value` — this is your search-only key. It is shown only once.
4. Confirm the key works:

   ```bash
   curl "https://<host>/collections/<your-collection>/documents/search?q=*&per_page=1" \
     -H "X-TYPESENSE-API-KEY: <SEARCH_KEY>"
   ```

   You should get a JSON response containing a `found` count.

## Configuration fields

| Field | Required | What it is / where to find it |
|-------|----------|-------------------------------|
| **Host URL** | Yes | Your Typesense base URL, e.g. `https://xxxxxxxxx.a1.typesense.net`. Must be `https://` — the API key is sent as a request header, so plaintext HTTP is rejected. No trailing slash. From the Typesense Cloud dashboard (nodes hostname) or your self-hosted address. |
| **Search API key** | Yes | A search-only API key (`documents:search` action). See "getting a search API key" above. Stored securely. |
| **Collection** | Yes | The name of the collection this data source queries, e.g. `products`. The key must be authorised for this collection. Add another data source for another collection. |

When you save the configuration, the plugin runs a lightweight `q=*` search against the collection to confirm the host, key, and collection are all valid.

## What gets indexed

Nothing. This is a query-only plugin — it imports no objects into the SquaredUp graph. Data is retrieved live each time a tile runs.

## Data streams

- **Document Search** — structured search against the configured collection. Tile parameters: `q` (query, default `*`), `query_by`, `filter_by`, `sort_by`, `per_page` (1–250). Returns one row per matching document, with the document's own fields as columns plus a relevance score.
- **Multi Search** — runs a raw `multi_search` JSON blob (e.g. `{"searches":[{"q":"*"}]}`) for federated or advanced queries. Returns one row per hit across all sub-searches, numbered in the **Search #** column. `"union": true` queries also work — Typesense returns one merged, globally ranked set for those, so **Search #** is empty since a row cannot be traced back to a single sub-search.
- **Search Summary** — returns a single row with the number of matching documents, total documents scanned, and search time.

## Known limitations

- **Search-only scope.** No cluster health, metrics, API-key or alias management, and no collection/document import — these require an admin key.
- **Result size.** This plugin caps `per_page` at 250, matching Typesense's default `--max-per-page` server limit. Self-hosted servers can raise that limit, but the plugin still caps at 250 — search is designed to return the most relevant results, not to bulk-export a collection.
- **Response size.** Very large result sets can exceed SquaredUp's ~6MB per-request limit — keep `per_page` and returned field counts reasonable, or use `filter_by` to narrow results.
- **No time range.** Typesense search has no built-in time-range parameter, so these streams return current results with no timeframe picker. To restrict by time, add a `filter_by` on a timestamp field in your documents.
