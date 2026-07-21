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
                "type": "deviceType",
                "properties": [
                    "siteId",
                    "instance",
                    { "deviceType": "dbusServiceType" }
                ]
            }
        },
        {
            "name": "deviceAlerts",
            "dataStream": { "name": "deviceAlerts" },
            "scope": {
                "query": "g.V().has(\"sourceType\", \"Router\")"
            },
            "timeframe": "none",
            "objectMapping": {
                "id": "uid",
                "name": "message",
                "type": { "value": "Device Alert" },
                "properties": ["severity", "raisedAt", "deviceId"]
            },
            "optional": true,
            "dependsOn": ["devices"]
        }
    ]
}
```

**Key rules for `steps`:**

- `dataStream.name` maps to a dataStream.json definition in /dataStreams using it's `name` property, this stream should return data with columns that map to the below
- `objectMapping.id` maps to the column holding the unique stable ID. The stored `sourceId` is prefixed with `sourceType~` — e.g. if `id` returns `"123"` and type is `"My Device"`, the stored value is `"My Device~123"`. To use the raw ID in expressions use `{{object.rawId}}`.
- `objectMapping.name` maps to the display name column.
- `objectMapping.type` maps to the `sourceType` column. It can also be a fixed string: `{ "value": "My Device" }` — use when all rows are the same type, rather than a computed column.
- `objectMapping.properties` are extra fields stored on the graph node, accessible in scripts as `object.propName`.
- Use `{ "targetProp": "sourceProp" }` syntax when the column name differs from the desired property name.
- **Never map a column into `properties` that is already mapped as `id`, `name`, or `type`.** The id's raw value is always available on every object as `rawId` (`{{object.rawId}}` in templates, `context.objects[N].rawId` in scripts — and as a scalar, unlike user-defined properties, which arrive as arrays), and the name as `name`. Adding e.g. `{ "projectId": "id" }` to `properties` when `"id": "id"` already exists creates a duplicate that has to be re-indexed to take effect and otherwise sits as dead config — use `rawId`/`name` instead.
- The `objectMapping.sourceType` column value **must** match an entry in `objectTypes` in `metadata.json`. For dynamic ones add these based on API response data later.
- `frequencyMinutes` — controls re-import interval. Defaults to `720` (12 hours).

The stream called by an import step must return one flat row per object with at least `sourceId`, `name` that are unique.

---

## Scoped, dependent steps

A step can be scoped to objects a *previous* step already imported, instead of calling a global list endpoint. Use this when an object type is only listable in the context of a parent (the API has "list alerts for device X", not "list all alerts") — the `deviceAlerts` step above is one:

- **`scope.query`** — a gremlin query run against the tenant's graph. It selects which already-imported objects this step's `dataStream` runs against, once per matched object (like a scoped data stream in Phase 6, not one call for everything). The value you filter on must be a `sourceType` the dependency actually produces — a fixed `{ "value": ... }` type, or one of the values a dynamic type column resolves to (here, one of the `deviceType` values the `devices` step's `dbusServiceType` column can return).
- **`dependsOn`** — names of steps that must finish (succeed or warn) before this one runs, so the objects `scope.query` needs already exist. Omit it (or leave it `[]`) for a root step, which runs immediately. It can list more than one step, and chains can be more than one level deep (`c` depends on `b`, which depends on `a`) — ordering across the whole graph is resolved automatically, so just name whichever step(s) must land first. Names must match real steps and can't form a cycle — both are rejected at deploy time.
- **`optional`** — when `true`, a failed step is recorded as a `warning` instead of a hard failure, which still counts as a green light for anything depending on it. Set it on a dependent step whose data isn't essential to a successful import, so one failing sub-resource doesn't cancel every step after it.

Building and testing a dependent step needs objects from its dependency to already be in the graph — see SKILL.md Phase 5 for the build/test order.

---

## Stream-level requirements

Import streams are ordinary data stream files in `dataStreams/` — they need `name`, `displayName`, `description`, and `tags` like any other stream. Mark import-only streams as hidden so they don't clutter the tile editor:

```json
"visibility": { "type": "hidden" }
```

- Do not prefix import data streams with import i.e. importFilms, unless there is a clear need, name them after the api used
- Avoid using a `config.postRequestScript` to reshape data unless needed, you can use a metadata column `valueExpression` to coerce a numeric string, id or a real number (`"valueExpression": "{{ $['url'].split('/').filter(Boolean).pop() }}"`) or derive a column.
- Use `config.expandInnerObjects` to reach a nested field.

---
