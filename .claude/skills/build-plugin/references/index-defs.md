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

The stream called by an import step must return one flat row per object with at least `sourceId`, `name`, `sourceType`:

```javascript
// scripts/installations.js
const installations = data?.records || [];

result = installations.map((inst) => ({
    sourceId: String(inst.idSite),
    sourceType: "My Installation",
    name: inst.name,
    siteId: String(inst.idSite),
    timezone: inst.timezone,
}));
```
