# Data Streams Reference

## Contents

- [baseDataSourceName — request modes](#basedatasourcename)
- [Stream-level properties](#stream-level-properties)
- [Visibility](#visibility)
- [matches — object selection](#matches)
- [Expressions in paths and query args](#expressions)
- [POST requests](#post-requests)
- [expandInnerObjects](#expandinnerobjects)
- [manualConfigApply](#manualconfigapply)
- [Pagination (paging)](#pagination)
- [errorHandling](#errorhandling)
- [pathToData](#pathtodata)
- [timeframes](#timeframes)
- [defaultShaping](#defaultshaping)
- [metadata — column definitions](#metadata-column-definitions)
- [Post-request scripts](#post-request-scripts)

---

## baseDataSourceName

**`httpRequestScopedSingle`** — one API request per selected object; results combined. Use when the API only accepts one object at a time.

```json
{
    "name": "batterySummary",
    "displayName": "Battery Summary",
    "description": "Current battery state",
    "tags": ["Energy", "Battery"],
    "baseDataSourceName": "httpRequestScopedSingle",
    "config": {
        "httpMethod": "get",
        "endpointPath": "installations/{{object.siteId}}/widgets/BatterySummary",
        "getArgs": [{ "key": "instance", "value": "{{object.instance}}" }],
        "postRequestScript": "batterySummary.js"
    },
    "matches": { "sourceType": { "type": "oneOf", "values": ["My Battery"] } },
    "metadata": [...],
    "timeframes": false
}
```

**`httpRequestScoped`** — one API request regardless of how many objects are selected. All selected objects available via `{{objects}}`. Use when the API accepts multiple objects in a single call.

```json
{
    "baseDataSourceName": "httpRequestScoped",
    "config": {
        "httpMethod": "get",
        "endpointPath": "devices/status",
        "getArgs": [
            {
                "key": "ids",
                "value": "{{objects.map(o => o.deviceId).join(',')}}"
            }
        ],
        "postRequestScript": "deviceStatus.js"
    },
    "matches": { "sourceType": { "type": "oneOf", "values": ["My Device"] } }
}
```

**`httpRequestUnscoped`** — no object selection. Single request with no object context. Use for global/account-level endpoints. Pair with `"matches": "none"`.

```json
{
    "baseDataSourceName": "httpRequestUnscoped",
    "config": { "httpMethod": "get", "endpointPath": "alerts" },
    "matches": "none"
}
```

---

## Stream-level properties

- `name` — internal identifier; derived by camelCasing the display name (e.g. `"CPU Usage"` → `cpuUsage`). **Renaming is a breaking change.**
- `displayName` — shown in the UI.
- `description` — one sentence, no full stop at end.
- `tags` — required; title case (e.g. `"Battery"`, `"Energy"`). Keep to a small, meaningful set.

---

## Visibility

Hide a stream from the tile editor when any of these apply:

- **Feeds a tile-editor dropdown only** — another stream references it via `dataInputs[].data.dataStreamName` (e.g. a stream that lists spreadsheets so the user can pick one). Not meant for dashboarding.
- **Powers indexing only** — referenced by `indexDefinitions/*.json` and the rows are awkward as a tile (raw IDs, internal fields). Users see the indexed objects via the built-in `datastream-properties` stream instead.
- **Used only by `configValidation.json`** — sole purpose is testing credentials or access during setup.

If a stream serves a real dashboarding purpose *and* one of the above, leave it visible — the dashboard use case wins.

```json
"visibility": { "type": "hidden" }
```

---

## matches

Controls whether SquaredUp asks the user to select objects. Target a **single object type** — do not match multiple types in one stream.

```json
// User picks objects of a specific type
"matches": { "sourceType": { "type": "oneOf", "values": ["My Device"] } }

// User picks any object from any plugin
"matches": "all"

// No object selection — global stream
"matches": "none"
```

Available operators on any property: `oneOf`, `notOneOf`, `contains`, `notContains`, `equals`, `notEquals`, `regex`, `notRegex`, `any`.

---

## Expressions

Expressions support **inline JavaScript** inside `{{ }}`:

```
{{objects.map(o => o.siteId).join(',')}}   // comma-separated list
{{paramName.split('/')[0]}}                // first segment of a slash-delimited param
{{object.name.toLowerCase()}}             // transform a property value
```

| Expression                                          | Resolves to                                            |
| --------------------------------------------------- | ------------------------------------------------------ |
| `{{dataSource.fieldName}}`                          | Plugin top-level config field (`ui.json`)              |
| `{{paramName}}`                                     | Data stream's own `ui` config (parameterised streams)  |
| `{{object.propName}}`                               | Property on matched object (`httpRequestScopedSingle`) |
| `{{objects}}`                                       | Array of selected objects (`httpRequestScoped`)        |
| `{{variable1}}`                                     | Selected object(s) from a dashboard variable           |
| `{{timeframe.start}}` / `{{timeframe.end}}`         | ISO 8601 strings                                       |
| `{{timeframe.unixStart}}` / `{{timeframe.unixEnd}}` | Unix epoch seconds                                     |
| `{{timeframe.interval}}`                            | Suggested data resolution, e.g. `PT1M`, `PT1H`         |
| `{{timeframe.enum}}`                                | Timeframe name, e.g. `last24hours`                     |

**Parameterised stream** (one configurable stream instead of many hardcoded ones):

```json
{
    "name": "deviceMetric",
    "displayName": "Device Metric",
    "ui": [{ "name": "metric", "label": "Metric Name", "type": "text" }],
    "config": {
        "endpointPath": "devices/{{object.deviceId}}/metrics",
        "getArgs": [
            { "key": "metric", "value": "{{metric}}" },
            { "key": "start", "value": "{{timeframe.unixStart}}" },
            { "key": "end", "value": "{{timeframe.unixEnd}}" }
        ]
    }
}
```

In OOB dashboard tiles, set the stream parameter in the tile's `dataStream` config.

---

## POST requests

```json
"config": {
    "httpMethod": "post",
    "endpointPath": "queries/_search",
    "postBody": "{{query}}"
}
```

`postBody` can be a template string or a JSON object with expressions:

```json
"postBody": {
    "statement": "{{query}}",
    "database": "{{typeof database !== 'undefined' ? database : undefined}}"
}
```

---

## expandInnerObjects

```json
"config": { "expandInnerObjects": true, ... }
```

Flattens nested objects into dot-notation columns (e.g. `{ "patchManagement": { "patchesInstalled": 5 } }` → `patchManagement.patchesInstalled`). Avoids needing a post-request script for simple nested structures.

---

## manualConfigApply

```json
"manualConfigApply": true
```

Shows an **Apply** button instead of running on every config change. Use for expensive or slow queries (e.g. database queries, large search requests).

---

## Pagination

**No paging:**

```json
"paging": { "mode": "none" }
```

**Next-URL** — API returns a URL for the next page in the response body or a header:

```json
"paging": {
    "mode": "nextUrl",
    "pageSize": { "realm": "queryArg", "path": "max", "value": "100" },
    "in": { "realm": "payload", "path": "pageDetails.nextPageUrl" }
}
```

**Token** — API returns a cursor/token to send with the next request:

```json
"paging": {
    "mode": "token",
    "pageSize": { "realm": "queryArg", "path": "limit", "value": "100" },
    "in": { "realm": "payload", "path": "meta.next_cursor" },
    "out": { "realm": "queryArg", "path": "cursor" }
}
```

**Offset** — increments a page number or row offset:

```json
"paging": {
    "mode": "offset",
    "pageSize": { "realm": "queryArg", "path": "limit", "value": "100" },
    "offset": {
        "mode": "page",
        "rowCountIn": { "realm": "payloadArraySize", "path": "items" },
        "base": 1
    },
    "out": { "realm": "queryArg", "path": "page" }
}
```

`realm` options: `"queryArg"`, `"header"`, `"body"` (POST only), `"payload"`, `"payloadArraySize"`.
`offset.mode`: `"page"` (increments 1,2,3…) or `"row"` (increments by page size).

---

## errorHandling

```json
// Extract error message from a response field
"errorHandling": { "type": "path", "realm": "payload", "path": "error.message" }

// Custom script — access response (.status, .body) and data
"errorHandling": { "type": "script", "script": "result = response.status + ': ' + data.error;" }
```

---

## pathToData

Selects a path within the response body; each element of the resolved array becomes one row:

```json
"config": { "httpMethod": "get", "endpointPath": "devices", "pathToData": "data.items" }
```

Works on primitives too — a string, number, or boolean at the path is returned as a single row with a `result` column.

> `rowPath` is a legacy alternative — use `pathToData` for new streams.

---

## timeframes

```json
"timeframes": false                          // current state only — no timeframe picker
"timeframes": true                           // all timeframes available (default)
"timeframes": ["last24hours", "last7days"]   // limit to specific options
```

JSON-only timeframe properties (not settable via the Save as data stream modal):

```json
"supportsNoneTimeframe": true      // adds "None" as a valid option
"defaultTimeframe": "none"         // new tiles default to "None"
"requiresParameterTimeframe": true // timeframe params always injected even without user selection
```

---

## defaultShaping

Sets default sort/group/aggregate behaviour when a tile is first added:

```json
"defaultShaping": { "sort": { "by": [["rank", "asc"]] } }
```

---

## metadata — column definitions

```json
{ "name": "voltage", "displayName": "Voltage (V)", "shape": "number" }
{ "name": "status", "displayName": "Status", "shape": "state" }
{ "name": "label", "displayName": "Name", "shape": "string", "role": "label" }
{ "name": "ts", "displayName": "Time", "shape": "string", "role": "timestamp" }
{ "name": "id", "displayName": "ID", "shape": "string", "visible": false }
{ "pattern": ".*" }   // catch-all: include all columns, infer types from values
```

Always use `displayName` — column names in scripts are often terse API field names.

**Column inclusion — choose one approach:**

- **All columns**: include `{ "pattern": ".*" }` as the last entry.
- **Explicit set only**: list each column; unlisted columns are hidden.
- **Mix**: list specific columns with shapes/roles, then add the pattern for the rest.

**Type inference**: SquaredUp infers column types from the JS primitive returned. Return the correct primitive type from your script — don't coerce to string. Declared `shape` overrides inference.

### Shapes

_Value_

| Shape       | Notes                                                                    |
| ----------- | ------------------------------------------------------------------------ |
| `"string"`  | Plain text                                                               |
| `"number"`  | Numeric. Options: `decimalPlaces` (0–10), `thousandsSeparator` (boolean) |
| `"boolean"` | Boolean                                                                  |

_Time_

| Shape            | Notes                                                                              |
| ---------------- | ---------------------------------------------------------------------------------- |
| `"date"`         | Date/datetime. Options: `format` (e.g. `"dd/MM/yyyy"`), `timeZone`, `inputPattern` |
| `"seconds"`      | Duration in seconds. Options: `formatDuration`, `decimalPlaces`                    |
| `"milliseconds"` | Duration in milliseconds                                                           |
| `"minutes"`      | Duration in minutes                                                                |

_Math_

| Shape       | Notes                                                                     |
| ----------- | ------------------------------------------------------------------------- |
| `"percent"` | Percentage 0–100. Options: `asZeroToOne` (multiply by 100 before display) |

_Data size_ (auto-scale, 1024 factors): `"bytes"`, `"kilobytes"`, `"megabytes"`, `"gigabytes"`, `"terabytes"`, `"petabytes"`, `"exabytes"`, `"zettabytes"`, `"yottabytes"`

_Data rates_:

- Metric bit rates (×1000): `"bitspersecondmetric"`, `"kilobitspersecond"`, `"megabitspersecond"`, `"gigabitspersecond"`, `"terabitspersecond"`
- Binary bit rates (×1024): `"bitspersecondbinary"`, `"kibibitspersecond"`, `"mebibitspersecond"`, `"gibibitspersecond"`, `"tebibitspersecond"`
- Decimal byte rates (×1000): `"bytesperseconddecimal"`, `"kilobytespersecond"`, `"megabytespersecond"`, `"gigabytespersecond"`, `"terabytespersecond"`
- Binary byte rates (×1024): `"bytespersecondbinary"`, `"kilobytespersecondbinary"`, `"megabytespersecondbinary"`, `"gigabytespersecondbinary"`, `"terabytespersecondbinary"`

_Currency_: `"usd"`, `"eur"`, `"gbp"`, `"currency"` (options: `code` e.g. `"jpy"`)

_Special_

| Shape          | Notes                                                                                       |
| -------------- | ------------------------------------------------------------------------------------------- |
| `"state"`      | Health dot. Values: `success`, `warning`, `error`, `unknown`, `unmonitored`. Options: `map` |
| `"url"`        | Hyperlink. Options: `label` (static or template e.g. `"{{column.name}}"`)                   |
| `"json"`       | JSON display                                                                                |
| `"guid"`       | GUID                                                                                        |
| `"customunit"` | Custom unit label. Options: `prefix`, `separator`                                           |

**Array form** — use when you need formatting options:

```json
{ "name": "price", "shape": ["number", { "decimalPlaces": 2 }] }
{ "name": "expiry", "shape": ["date", { "format": "dd/MM/yyyy" }] }
{ "name": "updatedAt", "shape": ["date", { "format": "dd/MM/yyyy hh:mm", "timeZone": "Etc/UTC" }] }
{ "name": "health", "shape": ["state", { "map": { "success": ["ok","active"], "error": ["failed","down"], "warning": ["degraded"] } }] }
{ "name": "cost", "shape": ["currency", { "code": "jpy" }] }
```

### Roles

| Role          | Description                                                                  |
| ------------- | ---------------------------------------------------------------------------- |
| `label`       | Primary display name for the row                                             |
| `value`       | Primary data value (used by scalar tiles)                                    |
| `timestamp`   | Time axis column for line graphs                                             |
| `id`          | Unique row identifier                                                        |
| `sourceId`    | Object identifier — enables drilldowns when paired with a fixed `sourceType` |
| `link`        | Hyperlink or navigation field                                                |
| `unitLabel`   | Measurement unit identifier                                                  |
| `comparison`  | Enables comparative analysis                                                 |
| `computed`    | Derived or calculated field                                                  |
| `description` | Supplementary explanatory content                                            |
| `none`        | No specific role                                                             |

### Computed columns

Derive a value from another column without a script:

```json
{
    "name": "complianceState",
    "displayName": "Compliance State",
    "computed": true,
    "valueExpression": "{{ $['softwareStatus'] }}",
    "shape": [
        "state",
        {
            "map": {
                "success": ["Compliant"],
                "error": ["Not Compliant"],
                "warning": [],
                "unknown": []
            }
        }
    ]
}
```

### Drilldown metadata entry

Links a column value to an object in the graph:

```json
{
    "sourceId": "deviceId", // column whose value is the sourceId
    "sourceType": "My Device", // MUST be a fixed string — cannot be dynamic
    "name": "deviceName" // column to use as the display name
}
```

> ⚠️ `sourceType` must be a hardcoded string. Dynamic per-row sourceType is not supported.

> ⚠️ **Blocks tiles** also require `linkColumn` in the viz config set to the same column as `name` in the drilldown entry. Without it, blocks render but don't navigate.

### Object property lookup

Replace a raw ID column with a human-readable property from a related indexed object:

```json
{ "name": "AgentName", "sourceId": "AgentID", "sourceType": "my-agent", "objectPropertyPath": "name" }

// Combine properties
{ "name": "AgentLabel", "sourceId": "AgentID", "sourceType": "my-agent",
  "objectPropertyPath": "name", "valueExpression": "{{ object.name }} ({{ object.company }})" }
```

---

## Post-request scripts

Scripts run after the HTTP response is received. Input is `data` (parsed JSON body). Set `result` to an array of row objects.

**Only use a script when the response genuinely needs structural transformation.** Avoid scripts for:

- Renaming columns — use `displayName` in metadata instead
- State mapping — use the `state` shape with a `map` option instead
- Simple path selection — use `pathToData` instead

Use scripts for: flattening nested structures, filtering, deduplicating, joining response fields, computing derived values.

### Available globals

Scripts have access to `data`, `context`, and **lodash** (`_`):

```javascript
_.groupBy(items, "type");
_.uniqBy(items, "id");
_.orderBy(items, ["name"], ["asc"]);
```

### The context object

```javascript
context.objects; // array of selected objects (their indexed properties)
context.objects[0]; // first selected object — use with httpRequestScopedSingle
context.timeframe; // { start, end, unixStart, unixEnd, interval, enum }
context.config; // current stream parameters (values set by the user in the tile)
```

### Type primitives

Return actual JS number primitives for numeric columns — returning `"29.19"` (string) instead of `29.19` (number) causes the column to show as String type.

### Deduplication pattern

```javascript
const seen = new Set();
const devices = [];

for (const record of data?.records || []) {
    const key = `${record.type}-${record.instance}`;
    if (seen.has(key)) continue;
    seen.add(key);
    devices.push({ sourceId: key, name: record.name, sourceType: "My Device" });
}

result = devices;
```
