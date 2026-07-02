# BCorp

Query the public [Certified B Corporation](https://www.bcorporation.net/en-us/find-a-b-corp/) company directory directly in SquaredUp. This is a **zero-configuration** data source — add it and start querying data about certified B Corps.

It is built on the [Typesense](https://github.com/squaredup/plugins/tree/main/plugins/Typesense) plugin (`base.plugin: "typesense"`), with the host, collection, and public search key hardcoded, so it inherits Typesense's search data streams pointed at the B Corp directory.

## What this plugin does

- Runs structured searches over the B Corp company directory and returns one row per matching company.
- Runs raw `multi_search` JSON queries for federated / advanced queries.
- Returns search result counts (matching companies, total scanned, timing).

## Prerequisites

None. The connection to the public B Corp directory (host, collection, and a public search-only API key) is built in.

## Configuration fields

None — nothing to enter. Add the plugin and it is ready to use.

## What gets indexed

Nothing. This is a query-only plugin — it imports no objects into the SquaredUp graph. Company data is retrieved live each time a tile runs.

## Data streams

Inherited from the Typesense plugin, pointed at the B Corp `companies` collection:

- **Document Search** — structured search over B Corp companies. Tile parameters: `q` (query, default `*`), `query_by`, `filter_by`, `sort_by`, `per_page`. Returns one row per matching company, with the company's fields as columns plus a relevance score.
- **Multi Search** — runs a raw `multi_search` JSON blob (e.g. `{"searches":[{"q":"*"}]}`) for federated or advanced queries.
- **Search Summary** — returns a single row with the number of matching companies, total scanned, and search time.

## Known limitations

- **Read-only public data.** This queries the public B Corp directory only; there is no admin access, no cluster metrics, and no import of companies as graph objects.
- **Result size.** A single search returns at most 250 companies per page (`per_page`). Use `filter_by` / `q` to narrow results.
- **Response size.** Very large result sets can exceed SquaredUp's ~6MB per-request limit — keep `per_page` and returned field counts reasonable.
- **No time range.** Search has no time-range parameter, so these streams return current results with no timeframe picker.
- **Directory data may change.** The underlying public directory (host, collection, and public search key) is maintained by B Lab and could change without notice, which would require an update to this plugin.
