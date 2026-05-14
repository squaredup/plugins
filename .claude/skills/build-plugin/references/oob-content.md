# OOB Default Content Reference

## Contents

- [scopes.json](#scopesjson)
- [manifest.json](#manifestjson)
- [Dashboard layout](#dashboard-layout)
- [Dashboard rules](#dashboard-rules)
- [Visualisation types](#visualisation-types): table, line graph, bar chart, scalar, donut, blocks, gauge, embed
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
    "schemaVersion": "1.4",
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

## Dashboard rules

- **Do not repeat the plugin name in dashboard names.** The name appears beneath the plugin name in the UI — "MyPlugin / Overview" is correct; "MyPlugin / MyPlugin Overview" is redundant.
- **Give each dashboard a distinct name.** Perspective tabs sit next to each other — identical names are indistinguishable.
- `"variables"` array supports **only one variable** per dashboard. Design each dashboard around a single object type.
- Omit `"timeframe"` on tiles to inherit the dashboard timeframe — do not hardcode it on individual tiles.
- All tile IDs (`"i"`) must be **genuinely random UUIDs** — generate with `python3 -c "import uuid; print(uuid.uuid4())"`. Never invent patterned UUIDs.

**Grid layout:**

- `w` + `x` must not exceed the column count.
- `h=2` works well for most tiles; use consistent heights for side-by-side tiles.
- **Match heights for side-by-side tiles.** Tiles at the same `y` must have the same `h` — mismatched heights leave a visible gap.
- Side-by-side pairing example: attributes table `w=1, x=0` + chart `w=3, x=1` at the same `y`.

---

## Visualisation types

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
            "yAxisColumns": ["value", "baseline"],
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
            "label": "Custom Label",
            "manualSize": 50,
            "formatted": false
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

### Embed

Image or iframe:

```json
{
    "type": "tile/embed",
    "config": {
        "tile/embed": { "src": "https://example.com/embed", "title": "" }
    }
}
```

---

## Templating tokens

| Token                          | Resolves to                        |
| ------------------------------ | ---------------------------------- |
| `{{configId}}`                 | The plugin config instance ID      |
| `{{workspaceId}}`              | Current workspace                  |
| `{{scopes.[ScopeName]}}`       | A scope by name from `scopes.json` |
| `{{dataStreams.[streamName]}}` | The data stream's ID               |
| `{{variables.[VariableName]}}` | The variable defined on a scope    |
