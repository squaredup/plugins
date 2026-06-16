# OOB Default Content Reference

> **Audience: the Phase 7 sub-agent.** OOB content is authored by a single build-mode sub-agent (see SKILL.md Phase 7); the main agent passes the dashboard plan in the prompt and never reads this file.

## Contents

- [scopes.json](#scopesjson)
- [manifest.json](#manifestjson)
- [Dashboard layout](#dashboard-layout)
- [Auto-scoping a stream](#auto-scoping-a-stream-via-its-objects-filter)
- [Shaping in the tile: group, filter, sort](#shaping-in-the-tile-group-filter-sort)
- [Dashboard rules](#dashboard-rules)
- [Visualisation types](#visualisation-types): table, line graph, bar chart, scalar, donut, blocks, gauge, text & image tiles
- [Monitors (opt-in thresholds)](#monitors-opt-in-thresholds)
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
                    "visualisation": {
                        "type": "data-stream-table",
                        "config": { "data-stream-table": { "transpose": true } }
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

The key under `dataSourceConfig` is the `name` of the stream's `objects` field. Given a stream with `"ui": [{ "type": "objects", "name": "project", ... }]`, the per-object perspective dashboard binds:

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

> ⚠️ **`group` renames the columns it outputs, and the pre-group columns do not survive.** `filter` matches the stream's **own (pre-group)** column names — but `sort` and **every `visualisation` field** (`value`, `labelColumn`, `xAxisColumn`, `yAxisColumn`, …) must reference the **post-group** names below. A tile that renders blank after deploy almost always has a viz field still pointing at a pre-group column name.

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

Common tiles, with the **exact** column names the visualisation must reference:

| Tile                          | `dataStream` shaping                                                                                                       | visualisation references                                     |
| ----------------------------- | -------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------ |
| Scalar — count all rows       | `"group":{"by":[],"aggregate":[{"type":"count"}]}`                                                                         | `value: "count"`                                             |
| Scalar — count a subset       | `"filter":{…}` + `"group":{"by":[],"aggregate":[{"type":"count"}]}`                                                        | `value: "count"`                                             |
| Scalar — total of a metric    | `"group":{"by":[],"aggregate":[{"type":"sum","names":["cost"]}]}`                                                          | `value: "cost_sum"`                                          |
| Donut — breakdown by category | `"group":{"by":[["status","uniqueValues"]],"aggregate":[{"type":"count"}]}`                                                | `labelColumn: "status_uniqueValues"`, `valueColumn: "count"` |
| Bar — top 10 by category      | as above + `"sort":{"by":[["count","desc"]],"top":10}`                                                                     | `xAxisData: "status_uniqueValues"`, `yAxisData: ["count"]`   |
| Line — metric over time       | `"group":{"by":[["date","byDay"]],"aggregate":[{"type":"sum","names":["cost"]}]}` + `"sort":{"by":[["date_byDay","asc"]]}` | `xAxisColumn: "date_byDay"`, `yAxisColumn: ["cost_sum"]`     |
| Table — filtered + sorted     | `"filter":{…}` + `"sort":{"by":[["lastSeen","desc"]]}` (no `group`)                                                        | raw stream column names                                      |

---

## Dashboard rules

- **Do not repeat the plugin name in dashboard names.** The name appears beneath the plugin name in the UI — "MyPlugin / Overview" is correct; "MyPlugin / MyPlugin Overview" is redundant.
- **Give each dashboard a distinct name.** Perspective tabs sit next to each other — identical names are indistinguishable.
- `"variables"` array supports **only one variable** per dashboard. Design each dashboard around a single object type.
- **A tile's `"timeframe"` is driven by its data stream, not by style.** If the tile's stream is **timeframe-independent** (`"timeframes": false` — a current-state / snapshot stream that ignores any range), set `"timeframe": "none"` on the tile. If the stream **supports timeframes**, **omit** `timeframe` so the tile tracks the dashboard's timeframe — setting `"none"` here pins the tile and stops it following the dashboard. (This is why most summary tiles, built on snapshot streams, carry `"none"`.)
- All tile IDs (`"i"`) must be **genuinely random UUIDs** — generate with `node ".claude/skills/build-plugin/scripts/gen-uuids.js" [N]`. Never invent patterned UUIDs.

**Grid layout:**

- `w` + `x` must not exceed the column count.
- `h=2` works well for most tiles; use consistent heights for side-by-side tiles.
- **Match heights for side-by-side tiles.** Tiles at the same `y` must have the same `h` — mismatched heights leave a visible gap.
- Side-by-side pairing example: attributes table `w=1, x=0` + chart `w=3, x=1` at the same `y`.

---

## Visualisation types

> The types below are **`visualisation.type` values inside a `tile/data-stream` tile** — they sit at `config.visualisation = { "type": "<one below>", "config": { "<type>": { … } } }` (see [Dashboard layout](#dashboard-layout)). Text and image tiles are **not** data-stream visualisations — they are their own tile `_type`; see [Text and image tiles](#text-and-image-tiles) at the end.
>
> Column references below (`value`, `labelColumn`, `xAxisColumn`, `yAxisColumn`, …) name the stream's own columns. If the tile **groups or aggregates**, reference the **post-group** names instead — see [Shaping in the tile](#shaping-in-the-tile-group-filter-sort).

### Table

Use `transpose: true` for key-value single-row data:

```json
{
    "type": "data-stream-table",
    "config": {
        "data-stream-table": {
            "transpose": false,
            "columnOrder": ["name", "status", "value"],
            "hiddenColumns": ["id", "internalKey"],
            "columnDisplayNames": { "ts": "Timestamp" },
            "resizedColumns": { "columnWidths": { "name": 250 } }
        }
    }
}
```

### Line graph

```json
{
    "type": "data-stream-line-graph",
    "config": {
        "data-stream-line-graph": {
            "xAxisColumn": "timestamp",
            "yAxisColumn": ["value", "baseline"],
            "seriesColumn": "none",
            "showLegend": true,
            "legendPosition": "bottom",
            "yAxisLabel": "Response time (ms)",
            "showYAxisLabel": true,
            "showTrendLine": false
        }
    }
}
```

> **Note:** `legendPosition` is required when `showLegend` is `true`. Valid values are `"top"`, `"bottom"`, `"left"`, and `"right"`.

### Bar chart

```json
{
    "type": "data-stream-bar-chart",
    "config": {
        "data-stream-bar-chart": {
            "xAxisData": "name",
            "yAxisData": ["count"],
            "xAxisGroup": "none",
            "xAxisLabel": "",
            "yAxisLabel": "",
            "showXAxisLabel": true,
            "showYAxisLabel": true,
            "showLegend": false,
            "legendPosition": "bottom",
            "showGrid": true,
            "horizontalLayout": "vertical",
            "displayMode": "actual",
            "showTotals": false,
            "showValue": false,
            "grouping": false,
            "range": { "type": "auto" }
        }
    }
}
```

### Scalar

Single value/KPI:

```json
{
    "type": "data-stream-scalar",
    "config": {
        "data-stream-scalar": {
            "value": "columnName",
            "comparisonColumn": "none",
            "label": "Custom Label"
        }
    }
}
```

### Donut chart

```json
{
    "type": "data-stream-donut-chart",
    "config": {
        "data-stream-donut-chart": {
            "valueColumn": "count",
            "labelColumn": "category",
            "hideCenterValue": false,
            "showValuesAsPercentage": true,
            "legendPosition": "auto",
            "legendMode": "table"
        }
    }
}
```

### Blocks

Health/status grid:

```json
{
    "type": "data-stream-blocks",
    "config": {
        "data-stream-blocks": {
            "labelColumn": "name",
            "stateColumn": "state",
            "sublabel": "status",
            "linkColumn": "none",
            "columns": 4
        }
    }
}
```

Use `"stateColumn": "none"` when data has no state — blocks render without health colour. To enable drilldowns, set `"linkColumn"` to the column named in the drilldown metadata entry:

```json
{
    "labelColumn": "name",
    "stateColumn": "none",
    "linkColumn": "name",
    "columns": 4
}
```

### Gauge

```json
{
    "type": "data-stream-gauge",
    "config": {
        "data-stream-gauge": {
            "value": { "type": "arr", "columns": ["columnName"] },
            "label": "Optional label",
            "minimum": 0,
            "maximum": 100,
            "minimumColumn": "minCol",
            "maximumColumn": "maxCol"
        }
    }
}
```

`value` options: `{ "type": "arr", "columns": ["col"] }`, `{ "type": "count" }`, `{ "type": "sum", "columns": ["col"] }`, `{ "type": "mean", "columns": ["col"] }`.

### Text and image tiles

These are **not** data-stream visualisations — they're standalone tiles with no `dataStream`, `scope`, or `activePluginConfigIds`. The tile type is set by the **tile's own `_type`** (`tile/text` or `tile/image`), and the content lives under `visualisation.config` — note there is **no `visualisation.type`**, and the inner `config` is **not** keyed by the type name (unlike the data-stream tiles above). Each block below is the tile's `config`; it drops into a grid `contents` item in place of the `tile/data-stream` config shown in [Dashboard layout](#dashboard-layout). Use a text tile for section headings / annotations and an image tile for a logo or static image.

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

**Image tile** — a static image by URL:

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

## Monitors (opt-in thresholds)

A **monitor** re-evaluates a tile's data on a schedule and sets a health state (`error` / `warning` / `success`) on the tile — which surfaces in the dashboard and the workspace's health, and can drive notifications. This is the mechanism behind a "N firewalls disabled → red tile" health KPI.

> ⚠️ **Ship monitors disabled, under `monitorOld` — never `monitor`.** The product only evaluates the `monitor` field; `monitorOld` is the "configured-but-off" slot (turning monitoring on for the tile in-product promotes `monitorOld` → `monitor`). Authoring under `monitorOld` means the monitor arrives **pre-built but switched off**, so adding the plugin does **not** start firing alerts at the user unprompted — they opt in per tile when ready. A monitor under `monitor` would be live the instant the plugin is installed, which is hostile default behaviour for a community plugin. So: build the threshold, then put it in `monitorOld`.

**Use them sparingly.** Each monitor re-queries on its `frequency`, so they have a real cost. Only attach one to a tile with a clear, binary health signal — a count of unhealthy / non-compliant / failed items — and keep them few; don't put one on every tile.

The opt-in threshold pattern (count of bad things `> 0` → `error`) pairs naturally with a scalar **count** tile:

```json
"monitorOld": {
    "_type": "simple",
    "monitorType": "threshold",
    "aggregation": "count",
    "groupBy": "__group_by_none__",
    "frequency": 15,
    "tileRollsUp": true,
    "condition": {
        "columns": [],
        "logic": { "if": [{ ">": [{ "var": "count" }, 0] }, "error"] }
    }
}
```

This block sits inside the tile's `config`, alongside `dataStream` / `visualisation`. Field by field:

| Field                | Meaning                                                                                                                                            |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| `_type`              | `"simple"` — a monitor built from the UI controls, as opposed to a hand-written script.                                                            |
| `monitorType`        | `"threshold"` — compare an aggregated value against a number.                                                                                       |
| `aggregation`        | How to reduce the rows before testing — `"count"` exposes the row count as the `count` variable used in `logic`.                                    |
| `groupBy`            | `"__group_by_none__"` — evaluate the whole result as one state (no per-group states).                                                               |
| `frequency`          | Minutes between evaluations. `15` is typical; raise it for expensive queries.                                                                       |
| `tileRollsUp`        | `true` — this tile's state contributes to the dashboard / workspace health rollup.                                                                 |
| `condition.columns`  | Columns the condition references; `[]` when the test is purely on the aggregation.                                                                  |
| `condition.logic`    | jsonLogic. `if` is `[<comparison>, <state>]`: when the comparison is true the tile takes `<state>`. `{ "var": "count" }` reads the `count` aggregation; operators are `>`, `<`, `>=`, `<=`, `==`, `!=`. |

For tiered states, extend the `if` array with a second condition/state pair, **most-severe first** (the first true condition wins) — e.g. `[{ ">": [{ "var": "count" }, 10] }, "error", { ">": [{ "var": "count" }, 0] }, "warning"]`.

---

## Templating tokens

| Token                          | Resolves to                        |
| ------------------------------ | ---------------------------------- |
| `{{configId}}`                 | The plugin config instance ID      |
| `{{workspaceId}}`              | Current workspace                  |
| `{{scopes.[ScopeName]}}`       | A scope by name from `scopes.json` |
| `{{dataStreams.[streamName]}}` | The data stream's ID               |
| `{{variables.[VariableName]}}` | The variable defined on a scope    |
