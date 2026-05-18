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
                "id": "sourceId",
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
                "id": "sourceId",
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

- `id` maps to the column holding the unique stable ID. The stored `sourceId` is prefixed with `sourceType~` — e.g. if `id` returns `"123"` and type is `"My Device"`, the stored value is `"My Device~123"`. Never rely on the raw ID in expressions — add it as a separate `properties` entry (e.g. `deviceId`) and reference `{{object.deviceId}}`.
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
            "pageSize": { "realm": "queryArg", "path": "limit", "value": "100" },
            "offset": { "mode": "page", "rowCountIn": { "realm": "payloadArraySize", "path": "items" }, "base": 1 },
            "out": { "realm": "queryArg", "path": "page" }
        }
    },
    "matches": "none",
    "metadata": [
        { "name": "sourceId", "computed": true, "valueExpression": "{{ $['id'] }}", "visible": false },
        { "name": "sourceType", "computed": true, "valueExpression": "My Device", "visible": false },
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
- `computed: true` + `valueExpression` materialises `sourceId`/`sourceType` from `id` and a constant string.
- `valueExpression` coerces `"unknown"` / `"n/a"` to `null` for numeric columns.

The index definition then references the dot-notation column names directly:

```json
"objectMapping": {
    "id": "sourceId",
    "name": "attributes.name",
    "type": "sourceType",
    "properties": [
        { "deviceId": "id" },
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
        timezone: inst.timezone
    }))
);
```

See [data-streams.md § Post-request scripts](data-streams.md#post-request-scripts) for the full "do I need a script?" checklist.
