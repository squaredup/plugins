# OOB Default Content Reference

## Contents

- [scopes.json](#scopesjson)
- [manifest.json](#manifestjson)
- [Dashboard layout](#dashboard-layout)
- [Auto-scoping a stream](#auto-scoping-a-stream-via-its-objects-filter)
- [Shaping in the tile: group, filter, sort](#shaping-in-the-tile-group-filter-sort)
- [Dashboard rules](#dashboard-rules)
- [SmartViz charts (`vizSpec`)](#smartviz-charts-vizspec) — fetch live guidance with `squaredup skill visualize`
- [Text and image tiles](#text-and-image-tiles)
- [Templating tokens](#templating-tokens)

---

## scopes.json

One scope per object type — used to populate tile scope pickers in dashboards:

```json
[
    {
        "name": "Installations",
        "matches": {
            "sourceType": { "type": "oneOf", "values": ["My Installation"] }
        },
        "variable": {
            "name": "Installation",
            "allowMultipleSelection": false,
            "default": "none",
            "type": "object"
        }
    },
    {
        "name": "Devices",
        "matches": {
            "sourceType": { "type": "oneOf", "values": ["My Device"] }
        },
        "variable": {
            "name": "Device",
            "allowMultipleSelection": false,
            "default": "none",
            "type": "object"
        }
    }
]
```

Only include scopes that are actually used by OOB dashboards or dashboard variables. Don't add scopes speculatively.

---

## manifest.json

```json
{
    "items": [
        { "name": "installationOverview", "type": "dashboard" },
        { "name": "deviceDashboard", "type": "dashboard" },
        { "name": "Installations", "type": "folder" }
    ]
}
```

Single `.dash.json` files reference as `"type": "dashboard"`. Folders map to sub-directories, each with its own `manifest.json`. Only create a folder when there are multiple dashboards to group for the same object type.

---

## Dashboard layout

```json
{
    "name": "My Dashboard",
    "schemaVersion": "1.5",
    "timeframe": "last24hours",
    "variables": ["{{variables.[Installation]}}"],
    "dashboard": {
        "_type": "layout/grid",
        "columns": 4,
        "version": 1,
        "contents": [
            {
                "i": "unique-uuid-here",
                "x": 0,
                "y": 0,
                "w": 2,
                "h": 4,
                "moved": false,
                "static": false,
                "z": 0,
                "config": {
                    "_type": "tile/data-stream",
                    "title": "My Tile",
                    "description": "",
                    "activePluginConfigIds": ["{{configId}}"],
                    "dataStream": {
                        "id": "{{dataStreams.[myStream]}}",
                        "name": "myStream",
                        "pluginConfigId": "{{configId}}"
                    },
                    "scope": {
                        "scope": "{{scopes.[Installations]}}",
                        "workspace": "{{workspaceId}}",
                        "variable": "{{variables.[Installation]}}"
                    },
                    "variables": ["{{variables.[Installation]}}"],
                    "vizSpec": {
                        "version": "1.0",
                        "visualization": {
                            "chartType": "scalar",
                            "encoding": { "values": [{ "field": "name", "type": "nominal", "aggregate": "count" }] },
                            "style": { "scalarLabelPosition": "none" }
                        }
                    }
                }
            }
        ]
    }
}
```

---

## Auto-scoping a stream via its `objects` filter

The tile-level `"scope"` block above is for streams that are **natively scoped** through their `matches`. A stream that is unscoped at the definition level (`"matches": "none"`) but exposes an optional `objects` parameter — the consolidation pattern in [data-streams.md](data-streams.md#one-stream-per-shape) — auto-scopes on a perspective a different way: **bind the dashboard variable into the parameter** under `dataStream.dataSourceConfig`.

The key under `dataSourceConfig` is the `name` of the stream's `objects` field. Stream parameters on a tile always go under `dataStream.dataSourceConfig`. The platform silently ignores anything placed under `dataStream.config`, so the tile runs with defaults and looks plausible but wrong. Given a stream with `"ui": [{ "type": "objects", "name": "project", ... }]`, the per-object perspective dashboard binds:

```json
"dataStream": {
    "name": "cost",
    "id": "{{dataStreams.cost}}",
    "pluginConfigId": "{{configId}}",
    "dataSourceConfig": {
        "project": {
            "variable": "{{variables.[Vercel Project]}}",
            "workspace": "{{workspaceId}}",
            "scope": "{{scopes.[Vercel Projects]}}"
        }
    }
}
```

- **Per-object dashboard** (drilldown / perspective) → bind the variable as above; the stream returns rows for that object only.
- **Account-wide dashboard** → **omit** `dataSourceConfig.project`; the optional filter is empty and the stream returns everything. ⚠️ Verify the account-wide tile actually renders after deploy: the picker resolver throws `Cannot use 'in' operator to search for 'nodeIds' in null` when it receives a _null_ selection (seen in test mode when the `--ui` flag is omitted — see [testing.md](testing.md#testing-a-consolidated-stream-optional-objects-param)). If an omitted binding hits that on a live tile, supply an explicit empty selection instead of omitting the key.

This is what lets **one** stream back both the account overview and the per-object drilldown — you do not need a separate `matches`-scoped stream for the drilldown. For the stream/field side of this, see [ui.md](ui.md) (`objects` field type) and [data-streams.md](data-streams.md#one-stream-per-shape).

---

## Shaping in the tile: `group`, `filter`, `sort`

A data stream returns **one fixed row shape**. How those rows are grouped, aggregated, time-bucketed, filtered, or sorted **for a specific tile is the tile's job** — set these under `dataStream`, alongside `name`/`id`. This is what lets one stream back many tiles; for _why_ shaping belongs here and not in a second stream, see [data-streams.md](data-streams.md#one-stream-per-shape). The three properties run in a fixed order:

**`filter` → `group` → `sort`.**

> ⚠️ **`group` renames the columns it outputs, and the pre-group columns do not survive.** `filter` matches the stream's **own (pre-group)** column names — but `sort` and **every `field` in the tile's `vizSpec`** must reference the **post-group** names below. A tile that renders blank after deploy almost always has a `field` still pointing at a pre-group column name.

| Shaping you configure                                        | Output column name         |
| ------------------------------------------------------------ | -------------------------- |
| group-by `status` (default `uniqueValues` grouper)           | `status_uniqueValues`      |
| time-bucket `date` with `byDay`                              | `date_byDay`               |
| aggregate `count`                                            | `count`                    |
| aggregate `sum`/`mean`/`min`/`max`/`median`/`mode` of `cost` | `cost_sum`, `cost_mean`, … |
| aggregate `distinctCount` of `userId`                        | `userId_distinctCount`     |

### `group` — aggregate and time-bucket rows

```json
"dataStream": {
    "id": "{{dataStreams.[devices]}}",
    "name": "devices",
    "pluginConfigId": "{{configId}}",
    "group": {
        "by": [["status", "uniqueValues"]],
        "aggregate": [{ "type": "count" }]
    }
}
```

- **`by: []`** (empty) with an `aggregate` collapses the whole stream to **one row** — the scalar-KPI pattern (total count, average age, …).
- **`by`** is a list of `[column, grouper]` pairs — **always nest**, even for one column. Groupers:

| Grouper                                         | Use on        | Groups rows by           |
| ----------------------------------------------- | ------------- | ------------------------ |
| `uniqueValues` (default)                        | any column    | exact value              |
| `byHour` `byDay` `byMonth` `byQuarter` `byYear` | a date column | the start of that period |

- **`aggregate`** is a list of `{ "type": <aggregator>, "names": [<column>] }`. `count` takes no `names`; every other aggregator takes exactly one column:

| Aggregator                               | Produces                                              |
| ---------------------------------------- | ----------------------------------------------------- |
| `count`                                  | row count → column `count`                            |
| `sum` `mean` `min` `max` `median` `mode` | over one numeric column → `<col>_<type>`              |
| `distinctCount`                          | distinct values of one column → `<col>_distinctCount` |

> ⚠️ **Multi-column grouping must be nested.** `"by": ["status", "team"]` is read as _one_ column `status` with grouper `team`, and throws `No shape grouper named team`. To group by several columns: `"by": [["status", "uniqueValues"], ["team", "uniqueValues"]]`.

### `filter` — keep a subset of rows

Applied **before** grouping, so its columns are the stream's own:

```json
"filter": {
    "multiOperation": "and",
    "filters": [
        { "column": "firewall_status", "operation": "notequals", "value": "Enabled" }
    ]
}
```

`multiOperation` (`and`/`or`) combines the `filters`. **`value` is always a string** — `"0"`, `"true"`, `"7"`.

| Operation                                     | Extra fields                 | Notes                                                     |
| --------------------------------------------- | ---------------------------- | --------------------------------------------------------- |
| `equals` `notequals` `contains` `notcontains` | `value`                      | string match                                              |
| `greaterthan` `lessthan`                      | `value`                      | numeric comparison                                        |
| `empty` `notempty`                            | —                            | column blank / not blank                                  |
| `datebefore` `dateafter`                      | —                            | before/after the dashboard timeframe                      |
| `datewithinnext` `datewithinlast`             | `value`, `unit`              | `unit`: `minutes`/`hours`/`days`/`weeks`/`months`/`years` |
| `datemorethan`                                | `value`, `unit`, `tenseUnit` | `tenseUnit`: `before`/`after`                             |

### `sort` — order rows (and take top-N)

Applied **after** grouping, so it references **post-group** names:

```json
"sort": { "by": [["count", "desc"]], "top": 10 }
```

`by` is a list of `[column, "asc" | "desc"]`; `top` (optional) keeps only the first N rows (e.g. a top-10 bar chart). On an ungrouped tile, sort by the raw stream column names.

### Recipes

Common tiles, with the **exact** column names the chart's `field`s must use:

| Tile                          | `dataStream` shaping                                                                                                       | Columns for the chart's `field`s   |
| ----------------------------- | -------------------------------------------------------------------------------------------------------------------------- | ---------------------------------- |
| Scalar — count all rows       | `"group":{"by":[],"aggregate":[{"type":"count"}]}`                                                                         | `count`                            |
| Scalar — count a subset       | `"filter":{…}` + `"group":{"by":[],"aggregate":[{"type":"count"}]}`                                                        | `count`                            |
| Scalar — total of a metric    | `"group":{"by":[],"aggregate":[{"type":"sum","names":["cost"]}]}`                                                          | `cost_sum`                         |
| Donut — breakdown by category | `"group":{"by":[["status","uniqueValues"]],"aggregate":[{"type":"count"}]}`                                                | `status_uniqueValues`, `count`     |
| Bar — top 10 by category      | as above + `"sort":{"by":[["count","desc"]],"top":10}`                                                                     | `status_uniqueValues`, `count`     |
| Line — metric over time       | `"group":{"by":[["date","byDay"]],"aggregate":[{"type":"sum","names":["cost"]}]}` + `"sort":{"by":[["date_byDay","asc"]]}` | `date_byDay`, `cost_sum`           |
| Table — filtered + sorted     | `"filter":{…}` + `"sort":{"by":[["lastSeen","desc"]]}` (no `group`)                                                        | the stream's own column names      |

---

## Dashboard rules

- **When unsure what makes a good dashboard, copy a shipped one.** The `plugins/` directory is full of mature OOB content — find a plugin whose data shape resembles yours and read its `.dash.json` files to see how real dashboards order tiles, mix visualisations, and lay out the grid. i.e. Lead with a summary row of scalar/KPI tiles, then breakdowns (donut/bar) and detail (tables/line graphs) below.
- **Do not repeat the plugin name in dashboard names.** The name appears beneath the plugin name in the UI — "MyPlugin / Overview" is correct; "MyPlugin / MyPlugin Overview" is redundant.
- **Give each dashboard a distinct name.** Perspective tabs sit next to each other — identical names are indistinguishable.
- `"variables"` array supports **only one variable** per dashboard. Design each dashboard around a single object type.
- **Every variable a tile references must be declared** in the dashboard's `"variables"` array, otherwise the binding resolves to nothing.
- **Keep request counts low on overview tiles.** A tile over an `httpRequestScopedSingle` stream sends one request per object in scope, so a summary of 50 environments is 50 API calls every time the dashboard loads. (Other scoped streams can send all the objects in one request.) Prefer a single list call, or a property captured at import, for account-wide summaries; keep per-object streams for drilldown dashboards.
- **A tile's `"timeframe"` is driven by its data stream, not by style.** If the tile's stream is **timeframe-independent** (`"timeframes": false` — a current-state / snapshot stream that ignores any range), set `"timeframe": "none"` on the tile. If the stream **supports timeframes**, **omit** `timeframe` so the tile tracks the dashboard's timeframe — setting `"none"` here pins the tile and stops it following the dashboard. (This is why most summary tiles, built on snapshot streams, carry `"none"`.)
- All tile IDs (`"i"`) must be **genuinely random UUIDs** — generate with `node ".claude/skills/build-plugin/scripts/gen-uuids.js" [N]`. Never invent patterned UUIDs.

**Grid layout:**

- `w` + `x` must not exceed the column count.
- `h=2` works well for most tiles; use consistent heights for side-by-side tiles.
- **Match heights for side-by-side tiles.** Tiles at the same `y` must have the same `h` — mismatched heights leave a visible gap.
- Side-by-side pairing example: attributes table `w=1, x=0` + chart `w=3, x=1` at the same `y`.

---

## SmartViz charts (`vizSpec`)

SmartViz is the platform's chart engine. A tile opts in with a `vizSpec` — a JSON chart spec — at `config.vizSpec`, a sibling of `dataStream`, `scope` and `timeframe`. The spec format and its rules change with the platform, so **this file deliberately does not document them**. Fetch the current guidance from the platform instead:

```sh
squaredup skill visualize            # the spec format, the rules, and a chart chooser
squaredup skill visualize --file references/cartesian.md   # one chart type's reference
squaredup skill visualize --all      # everything in one go
```

This is the same `visualize` skill the SquaredUp MCP server serves, so it is written for an agent editing live tiles. When you apply it to plugin default content:

- **Ignore the MCP tool steps.** The skill names tools such as `tile_create`, `tile_update`, `tile_query`, `data_stream_query` and `validate_visualization`. You write the `.dash.json` file directly; there is no tile to create or update.
- **Take column names from the stream.** Every `field` in the spec is a real column `name` — from the stream's `metadata` in `dataStreams/<name>.json`, or the post-group names when the tile groups (see [Shaping in the tile](#shaping-in-the-tile-group-filter-sort)). Confirm them by running the stream with the ids from your brief: `squaredup test <stream> --plugin-id <id> --datasource-id <id> --json --silent`. For a scoped stream, first get an object id with `squaredup objects <stream> --plugin-id <id> --datasource-id <id> --json --silent`, then add `--object <objectId>` to the test.
- **Validate it.** `squaredup validate` checks each tile's `vizSpec` against the schema the app renders with, and reports a failure at its path in the `.dash.json` (for example `dashboard.contents[3].config.vizSpec.visualization.chartType`). Fix every one: the app silently ignores a spec that fails the schema, so the tile would not show your chart. Validation cannot check that each `field` is a real column, so get the names right from the stream, using the post-group names when the tile groups.

If `squaredup skill` is not available, update the CLI with `npm i -g @squaredup/cli`.

---

## Text and image tiles

These are standalone tiles with no `dataStream`, `scope`, `activePluginConfigIds` or `vizSpec`. The tile type is set by the **tile's own `_type`** (`tile/text` or `tile/image`), and the content lives under `visualisation.config` — note there is **no `visualisation.type`**. Each block below is the tile's `config`; it drops into a grid `contents` item in place of the `tile/data-stream` config shown in [Dashboard layout](#dashboard-layout). Use a text tile for section headings / annotations and an image tile for a logo or static image.

**Text tile** — a heading or caption:

```json
{
    "_type": "tile/text",
    "title": "",
    "description": "",
    "visualisation": {
        "config": {
            "content": "Top Genre Breakdown",
            "fontSize": 16,
            "align": "center",
            "autoSize": true
        }
    }
}
```

**Image tile** — a static image by URL. A plugin can't upload images for its default dashboards, so `src` must be a public URL the image is already hosted at:

```json
{
    "_type": "tile/image",
    "title": "",
    "description": "",
    "visualisation": {
        "config": { "src": "https://example.com/logo.png", "title": "" }
    }
}
```

> An iframe/embed tile also exists (`tile/iframe`), but it is essentially unused in OOB content — prefer a data-stream tile or the tiles above.

---

## Templating tokens

| Token                          | Resolves to                        |
| ------------------------------ | ---------------------------------- |
| `{{configId}}`                 | The plugin config instance ID      |
| `{{workspaceId}}`              | Current workspace                  |
| `{{scopes.[ScopeName]}}`       | A scope by name from `scopes.json` |
| `{{dataStreams.[streamName]}}` | The data stream's ID               |
| `{{variables.[VariableName]}}` | The variable defined on a scope    |

**Escape every other `{{…}}` with `{{{{raw}}}}`.** These tokens are substituted when the default content is installed, and any other `{{…}}` in a `.dash.json` is substituted too, normally to nothing. Text that SmartViz itself fills in at render time therefore has to be wrapped so it reaches the tile intact. Typical cases are `labelFormat`, `cartesianTooltipTemplate` and `statusGridSecondaryTemplate`:

```json
"labelFormat": "{{{{raw}}}}{{value}}{{{{/raw}}}}"
```

A tile whose label or tooltip comes out blank after install usually has an unwrapped template.
