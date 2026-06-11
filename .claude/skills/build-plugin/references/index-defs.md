# indexDefinitions/default.json Reference

Defines what gets imported into the SquaredUp graph.

```json
{
    "steps": [
        {
            "name": "installations",
            "dataStream": { "name": "installations" },
            "timeframe": "none",
            "objectMapping": {
                "id": "uid",
                "name": "name",
                "type": "sourceType",
                "properties": ["siteId", "timezone", "alarm"]
            }
        },
        {
            "name": "devices",
            "dataStream": { "name": "deviceList" },
            "timeframe": "none",
            "objectMapping": {
                "id": "uid",
                "name": "name",
                "type": "sourceType",
                "properties": [
                    "siteId",
                    "instance",
                    { "deviceType": "dbusServiceType" }
                ]
            }
        }
    ]
}
```

**Key rules:**

- `id` maps to the column holding the unique stable ID. The stored `sourceId` is prefixed with `sourceType~` — e.g. if `id` returns `"123"` and type is `"My Device"`, the stored value is `"My Device~123"`. To use the raw ID in expressions use `{{object.rawId}}`.
- `name` maps to the display name column.
- `type` maps to the `sourceType` column. Can also be a fixed string: `{ "value": "My Device" }` — use when all rows are the same type.
- `properties` are extra fields stored on the graph node, accessible in scripts as `object.propName`.
- Use `{ "targetProp": "sourceProp" }` syntax when the column name differs from the desired property name.
- The `sourceType` column value **must** match an entry in `objectTypes` in `metadata.json`.
- `frequencyMinutes` — controls re-import interval. Defaults to `720` (12 hours).

---

## Import data stream pattern

The stream called by an import step must return one flat row per object with at least `sourceId`, `name`, `sourceType`.

### Prefer a script-less stream

A typical paged list endpoint — response shape `{ items: [{ id, attributes: { name, ... } }, ...] }` — can be turned into an indexable stream with **no post-request script**:

```json
{
    "name": "devices",
    "displayName": "Devices",
    "baseDataSourceName": "httpRequestUnscoped",
    "config": {
        "httpMethod": "get",
        "endpointPath": "devices",
        "pathToData": "items",
        "expandInnerObjects": true,
        "paging": {
            "mode": "offset",
            "pageSize": {
                "realm": "queryArg",
                "path": "limit",
                "value": "100"
            },
            "offset": {
                "mode": "page",
                "rowCountIn": { "realm": "payloadArraySize", "path": "items" },
                "base": 1
            },
            "out": { "realm": "queryArg", "path": "page" }
        }
    },
    "matches": "none",
    "metadata": [
        {
            "name": "id",
            "visible": false
        },
        {
            "name": "sourceType",
            "computed": true,
            "valueExpression": "My Device",
            "visible": false
        },
        { "name": "attributes.name", "displayName": "Name", "role": "label" },
        {
            "name": "attributes.cpuCores",
            "displayName": "CPU Cores",
            "valueExpression": "{{ ['unknown','n/a',''].includes($['attributes.cpuCores']) ? null : Number($['attributes.cpuCores']) }}",
            "shape": ["number", { "decimalPlaces": 0 }]
        }
    ],
    "timeframes": false
}
```

How this avoids a script:

- `pathToData: "items"` walks into the paged array — no `data.items.map(...)` in JS.
- `expandInnerObjects: true` flattens `attributes.*` into dot-notation columns (`attributes.name`, `attributes.cpuCores`).
- `computed: true` materialises `sourceId`/`sourceType` from a constant string.
- `valueExpression` coerces `"unknown"` / `"n/a"` to `null` for numeric columns.

The index definition then references the dot-notation column names directly:

```json
"objectMapping": {
    "id": "id",
    "name": "attributes.name",
    "type": "sourceType",
    "properties": [
        { "cpuCores": "attributes.cpuCores" }
    ]
}
```

### When a script is justified

Use a post-request script only when the transformation can't be expressed declaratively — for example, an API that returns nested arrays you need to expand into rows:

```javascript
// scripts/installations.js — flattens a nested device array within each installation
const installations = data?.records || [];

result = installations.flatMap((inst) =>
    (inst.devices || []).map((d) => ({
        sourceId: `${inst.idSite}-${d.id}`,
        sourceType: "My Device",
        name: d.name,
        siteId: String(inst.idSite),
        timezone: inst.timezone,
    })),
);
```

**"Do I need a script?" checklist** — if every line of the script you were about to write resolves to a row in this table, use the declarative feature and delete the script:

| Need                                                      | Use instead                                                                              |
| --------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| Navigate to a nested array                                | `pathToData: "a.b.items"`                                                                |
| Flatten one level of nested object per row                | `expandInnerObjects: true` (produces `nested.field` columns)                             |
| Constant column value per row (e.g. fixed sourceType)     | `{ "name": "sourceType", "computed": true, "valueExpression": "My Type" }`               |
| Derive one column from others on the same row             | `valueExpression: "{{ $['a'] + $['b'] }}"` (add `"computed": true` if not in response)   |
| Coerce `"unknown"` / `"n/a"` / `""` to null for a numeric | `valueExpression: "{{ ['unknown','n/a',''].includes($['x']) ? null : Number($['x']) }}"` |
| Rename for display only                                   | `displayName` in the column's metadata entry                                             |

Scripts are justified only for: deeply-nested (>1 level) or array-into-rows flattening (as above), cross-field filtering, deduplication, reduce-style operations (`_.groupBy` etc.), or parsing a non-JSON response body.

**Script wiring essentials:**

- Set `config.postRequestScript` to the filename **including `.js`**; name the file after the stream's `name` and place it in `dataStreams/scripts/`.
- The script receives the parsed response body as `data` (plus `response.body` for non-JSON, and lodash as `_`) and must assign an array of flat row objects to `result`.
- `pathToData` is **ignored** when a script is set — configure one or the other, never both.
- Return real JS primitives (numbers as numbers, not strings) so column types infer correctly.

### Other paging modes

The example stream above uses `offset` paging. The other modes:

```json
"paging": { "mode": "none" }

// Token/cursor — API returns a cursor to send with the next request
"paging": {
    "mode": "token",
    "pageSize": { "realm": "queryArg", "path": "limit", "value": "100" },
    "in": { "realm": "payload", "path": "meta.next_cursor" },
    "out": { "realm": "queryArg", "path": "cursor" }
}

// Next-URL — API returns the next page's URL in the body or a header
"paging": {
    "mode": "nextUrl",
    "pageSize": { "realm": "queryArg", "path": "max", "value": "100" },
    "in": { "realm": "payload", "path": "pageDetails.nextPageUrl" }
}
```

`realm` options: `queryArg`, `header`, `body` (POST only), `payload`, `payloadArraySize`. `offset.mode`: `page` (increments 1,2,3…) or `row` (increments by page size).

### Stream-level requirements

Import streams are ordinary data stream files in `dataStreams/` — they need `name`, `displayName`, `description`, and `tags` like any other stream. Mark import-only streams as hidden so they don't clutter the tile editor:

```json
"visibility": { "type": "hidden" }
```

---

> **This file is self-contained.** Authoring import streams does **not** require `data-streams.md` — that is the Phase 6 authoring guide read by sub-agents only, and pulling it into the main context wastes ~8K tokens.
