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
        }
    ]
}
```

**Key rules for `steps`:**

- `dataStream.name` maps to a dataStream.json definition in /dataStreams using it's `name` property, this stream should return data with columns that map to the below
- `objectMapping.id` maps to the column holding the unique stable ID. The stored `sourceId` is prefixed with `sourceType~` — e.g. if `id` returns `"123"` and type is `"My Device"`, the stored value is `"My Device~123"`. To use the raw ID in expressions use `{{object.rawId}}`.
- `objectMapping.name` maps to the display name column.
- `objectMapping.type` maps to the `sourceType` column. Can also be a fixed string: `{ "value": "My Device" }` — use when all rows are the same type, rather than a computed column.
- `objectMapping.properties` are extra fields stored on the graph node, accessible in scripts as `object.propName`.
- Use `{ "targetProp": "sourceProp" }` syntax when the column name differs from the desired property name.
- **Never map a column into `properties` that is already mapped as `id`, `name`, or `type`.** The id's raw value is always available on every object as `rawId` (`{{object.rawId}}` in templates, `context.objects[N].rawId` in scripts — and as a scalar, unlike user-defined properties, which arrive as arrays), and the name as `name`. Adding e.g. `{ "projectId": "id" }` to `properties` when `"id": "id"` already exists creates a duplicate that has to be re-indexed to take effect and otherwise sits as dead config — use `rawId`/`name` instead.
- The `objectMapping.sourceType` column value **must** match an entry in `objectTypes` in `metadata.json`. For dynamic ones add these based on API response data later.
- `frequencyMinutes` — controls re-import interval. Defaults to `720` (12 hours).

The stream called by an import step must return one flat row per object with at least `sourceId`, `name` that are unique.

---

### Stream-level requirements

Import streams are ordinary data stream files in `dataStreams/` — they need `name`, `displayName`, `description`, and `tags` like any other stream. Mark import-only streams as hidden so they don't clutter the tile editor:

```json
"visibility": { "type": "hidden" }
```

- Do not prefix import data streams with import i.e. importFilms, unless there is a clear need, name them after the api used
- Avoid using a `config.postRequestScript` to reshape data unless needed, you can use a metadata column `valueExpression` to coerce numeric string or a real number or derive a column.
- `config.expandInnerObjects` can be used to reach a nested field.

---
