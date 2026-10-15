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
- **Never use a reserved name as a property name.** The property name — a string entry, or the *key* in `{ "targetProp": "sourceProp" }` — becomes a property on the graph object, and the graph owns some names. Using one deploys cleanly, then fails the import with a raw schema error that doesn't mention your mapping:
    - `id`, and any `__`-prefixed name — always rejected: `Payload failed schema validation` … `/vertices/0/id` … `boolean schema is false`. You don't need it — the object's id is already `rawId` (above).
    - `state` — reserved by the platform; an API status (`"active"`) or a postal state (`"OH"`) fails with `must be equal to one of the allowed values`. Rename it: `{ "status": "state" }`, or `{ "region": "state" }` for an address.
    - `rawId`, `sourceId`, `sourceType`, `name`, `label` — silently overwritten by the platform, so the mapping does nothing.

    A reserved name is fine as the *source column* (`{ "status": "state" }` reads a column called `state`). `squaredup validate` rejects `id`, `state` and `__` names; it can't catch the silent overwrites.
- The `objectMapping.sourceType` column value **must** match an entry in `objectTypes` in `metadata.json`. For dynamic ones add these based on API response data later.
- `frequencyMinutes` — controls re-import interval. Defaults to `720` (12 hours).

The stream called by an import step must return one flat row per object with at least `sourceId`, `name` that are unique.

---

## Scoped, dependent steps

A step can be scoped to objects a *previous* step already imported, instead of calling a global list endpoint. Use this when an object type is only listable in the context of a parent (the API has "list alerts for device X", not "list all alerts") — the `deviceAlerts` step above is one:

- **`scope.query`** — a gremlin query run against the tenant's graph. It selects which already-imported objects this step's `dataStream` runs against. The stream must be a scoped stream (like a Phase 6 data stream, not the unscoped kind root steps use) whose `matches` covers the same `sourceType` the query selects — use `httpRequestScopedSingle` when the API takes one parent at a time (one request per matched object), or `httpRequestScoped` to receive all matched objects in one call via `{{objects}}`; see [data-streams.md](data-streams.md). The value you filter on must be a `sourceType` the dependency actually produces — a fixed `{ "value": ... }` type, or one of the values a dynamic type column resolves to (here, one of the values the `devices` step's `deviceType` type column can return).
- **`dependsOn`** — names of steps that must finish (succeed or warn) before this one runs, so the objects `scope.query` needs already exist. Omit it (or leave it `[]`) for a root step, which runs immediately. It can list more than one step, and chains can be more than one level deep (`c` depends on `b`, which depends on `a`) — ordering across the whole graph is resolved automatically, so just name whichever step(s) must land first. Names must match real steps and can't form a cycle — both are rejected at deploy time.
- **`optional`** — when `true`, a failed step is recorded as a `warning` instead of a hard failure, which still counts as a green light for anything depending on it. Set it on a dependent step whose data isn't essential to a successful import, so one failing sub-resource doesn't cancel every step after it.

Building and testing a dependent step needs objects from its dependency to already be in the graph — see SKILL.md Phase 5 for the build/test order.

---

## Large imports — choosing `pageSize`

An import step fetches one page at a time and writes each page's objects to the graph before asking for the next, so a step has no object-count limit of its own. Two limits bound the stream's [`paging.pageSize`](data-streams.md#pagination) from opposite sides instead:

| Limit | What it counts | `errorReason` when hit | Pushes `pageSize` |
| --- | --- | --- | --- |
| **~6MB per page** | One page, measured after SquaredUp formats it — larger than the raw API body. That page's objects are then written to the graph in a single request. | `Function.ResponseSizeTooLarge` | down |
| **~220 calls per import run** | Each page is one more call in a chain. A dependent step continues the chain of the step it `dependsOn`. | `'call-chain-length' reached threshold of 220` | up |

Each page must also return within the ~28s per-page timeout, another reason not to max out `pageSize`.

Size it for the **largest environment the plugin will meet**, not your test tenant — a 500-object test account passes at any page size:

1. **Pages** — `objects ÷ pageSize`, plus the pages of every step this one transitively `dependsOn`, must stay comfortably under ~200.
2. **Bytes** — `pageSize × bytes per row` should stay under ~2MB of raw API response, leaving headroom for formatting. Measure a real page during exploration, e.g. `curl … | wc -c`.

A worked example: a CrowdStrike import of ~92,700 hosts overflowed 6MB at 1,000 hosts per page. 250 per page would have needed ~371 calls, so 500 per page with a lean row (~186 calls) was the size that fit both limits.

**Keep import rows lean.** An import stream exists to feed `objectMapping` — return only the id, name, type and mapped properties. If the API has a field-selection parameter (`fields`, `select`, `$select`), use it, and leave nested blobs and anything only a dashboard needs to a separate data stream. Smaller rows let a larger `pageSize` fit under 6MB, which is what lets a big inventory fit under the call cap.

**If no `pageSize` satisfies both**, import less rather than fighting the limits: filter at the API (e.g. only active or managed hosts), or import a subset and query the rest live through unscoped data streams. Raise it with the user — the call cap is a platform setting, not something a plugin can change.

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
