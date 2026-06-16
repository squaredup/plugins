# Data Streams Reference

## Contents

- [One stream per shape (consolidate near-duplicates)](#one-stream-per-shape)
- [baseDataSourceName — request modes](#basedatasourcename)
- [Stream-level properties](#stream-level-properties)
- [Visibility](#visibility)
- [matches — object selection](#matches)
- [Expressions in config](#expressions)
- [Column expressions (valueExpression, formatExpression)](#column-expressions)
- [POST requests](#post-requests)
- [expandInnerObjects](#expandinnerobjects)
- [manualConfigApply](#manualconfigapply)
- [Pagination (paging)](#pagination)
- [errorHandling](#errorhandling)
- [pathToData](#pathtodata)
- [timeframes](#timeframes)
- [defaultShaping](#defaultshaping)
- [metadata — column definitions](#metadata-column-definitions)
- [Post-request scripts](#post-request-scripts) — [Wiring a script](#wiring-a-script-to-a-stream), [When to use](#default-no-script), [Globals](#available-globals), [Non-JSON responses](#parsing-non-json-responses)

---

## One stream per shape

A data stream encodes a transformation that is correct for **every** dashboard — parsing the response, excluding non-billable rows, scoping to an object. How those rows are then _grouped_, _aggregated_, _bucketed by time_, or _sorted_ is **presentation**, and the tile does it natively. Do not bake a presentation choice into its own stream.

**The consolidate/split test.** Before authoring a second stream on an endpoint you already cover, ask what actually differs:

| If the only difference is…                           | Verdict         | The tile already does this via…                                                        |
| ---------------------------------------------------- | --------------- | -------------------------------------------------------------------------------------- |
| **Grouping key** (by project / by service / …)       | **Consolidate** | tile `group.by`                                                                        |
| **Aggregation** (sum / mean / count / min / max)     | **Consolidate** | tile `group.aggregate`                                                                 |
| **Time granularity of a timeline** (daily / monthly) | **Consolidate** | the `byHour`/`byDay`/`byMonth`/`byQuarter`/`byYear` groupers on a `date`-shaped column |
| **Object scope** (account-wide vs one object)        | **Consolidate** | an optional `objects` filter bound to a dashboard variable (see below)                 |
| **A different endpoint / API call**                  | **Split**       | — different data, not a different view                                                 |
| **A different object type**                          | **Split**       | — different `matches`                                                                  |
| **A granularity the API can't return**               | **Split**       | a tile can bucket _coarser_ than the rows, never _finer_                               |

So: same rows, different view → **one** configurable stream. Different underlying data → split.

### Push grouping, filtering and sorting down to the cheapest layer

"One stream per shape" puts grouping, sorting and aggregation in the **tile** — not in a stream per view. But the tile isn't the only place that work can happen, and it isn't always the cheapest. Before defaulting to tile-side, ask whether the **API** can do it for you.

The same group/filter/sort can live in three layers. Prefer the highest one the endpoint supports:

| Layer                                                                              | Use when                                               | Why it wins                                                                                                                                                | Cost                                                                              |
| ---------------------------------------------------------------------------------- | ------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| **1 — API param** (`?groupBy=project`, `?interval=P1D`, `?status=open`, `?top=10`) | the endpoint offers a param that does it               | the API returns _less data_ — fewer bytes over the wire, less Lambda memory, and often the only way to stay under the [~6MB cap](#response-size-limit-6mb) | none, if you keep the param **optional** (below)                                  |
| **2 — Tile** (native `group`/`aggregate`/`sort`, `byDay`/`byMonth` buckets)        | the API has no param for it                            | one fine-grained stream still feeds every view; fully interactive                                                                                          | transfers every row, then groups in the browser                                   |
| **3 — Post-request script** (`_.groupBy`, reduce)                                  | neither layer can express it — rare for plain grouping | —                                                                                                                                                          | worst case: you pay to transfer _all_ rows **and** burn Lambda time grouping them |

So the rule is **push it down**: if the API can group/filter/sort, let it; otherwise the tile does it; a script does it only when the shape can't be expressed either way (see [When a script IS the right tool](#when-a-script-is-the-right-tool)).

**Make the API param optional — then you give up nothing.** Wire it to a stream `ui` field and leave it unset by default. Return `null`/`undefined` for the arg when the field is empty (`{{groupBy || null}}`) so the server drops it from the request (see [Expressions](#expressions)). Unset → the API returns fine-grained rows and the tile groups, exactly as "one stream per shape" intends. Set → the API groups and returns far less data. One stream covers both — and because a tile can carry **more than one dataset**, a user who wants two grains at once (cost by project _and_ by service) just adds the stream twice with different param values, so there's never a reason to hold the data fine "just in case".

The `cost` example below does exactly this: its optional `groupBy` `choiceChips` param **is** layer-1 push-down.

### Anti-pattern: five "Cost by X" streams

A shipped plugin has five cost streams — `costByProject`, `costByService`, `costDailyTimeline`, `projectCosts`, `projectCostTimeline`. All five issue the **identical** request to `/v1/billing/charges` (same `getArgs`), and each `postRequestScript` does the same thing: parse the NDJSON, filter to `ChargeCategory === 'Usage'`, then group-and-sum by a different key (project / service / day) — two of them additionally filtering to a scoped project. They differ **only** by group key and scope, which is exactly the "consolidate" column above.

**One stream replaces all five.** A single `cost` stream returns one row per finest-grained charge:

```jsonc
// dataStreams/cost.json — returns raw-ish rows; the dashboard shapes them
{
    "name": "cost",
    "displayName": "Cost",
    "description": "Usage cost, one row per charge",
    "tags": ["Cost", "Billing"],
    "baseDataSourceName": "httpRequestUnscoped",
    "config": {
        "httpMethod": "get",
        "endpointPath": "/v1/billing/charges",
        "getArgs": [
            { "key": "from", "value": "{{timeframe.start}}" },
            { "key": "to", "value": "{{timeframe.end}}" },
            { "key": "groupBy", "value": "{{groupBy || null}}" },
        ],
        "postRequestScript": "cost.js",
    },
    "matches": "none",
    "ui": [
        {
            "type": "objects",
            "name": "project",
            "label": "Project (optional)",
            "matches": {
                "sourceType": { "type": "oneOf", "values": ["Vercel Project"] },
            },
        },
        {
            "type": "choiceChips",
            "name": "groupBy",
            "label": "Group by",
            "options": [
                {
                    "value": "service",
                    "label": "Service",
                },
                {
                    "value": "project",
                    "label": "Project",
                },
            ],
        },
    ],
    "metadata": [
        {
            "name": "date",
            "displayName": "Date",
            "shape": "date",
            "role": "timestamp",
        },
        {
            "name": "projectName",
            "displayName": "Project",
            "shape": "string",
            "role": "label",
        },
        {
            "name": "serviceName",
            "displayName": "Service",
            "shape": "string",
            "role": "label",
        },
        {
            "name": "serviceCategory",
            "displayName": "Category",
            "shape": "string",
        },
        {
            "name": "totalCost",
            "displayName": "Cost ($)",
            "shape": [
                "currency",
                {
                    "decimalPlaces": 2,
                    "code": "usd",
                    "thousandsSeparator": true,
                },
            ],
            "role": "value",
        },
        {
            "name": "projectId",
            "displayName": "Project ID",
            "shape": "string",
            "visible": false,
        },
    ],
    "timeframes": ["last24hours", "last7days", "last30days"],
}
```

The dashboard then reproduces every original stream as a tile shaping (the exact `group`/`filter`/`sort` syntax, and the post-group column-naming rule, are in [oob-content.md](oob-content.md#shaping-in-the-tile-group-filter-sort)):

- **Cost by Project** → group by `projectName`, aggregate `sum`.
- **Cost by Service** → group by `serviceName`, aggregate `sum`.
- **Daily timeline** → bucket `date` `byDay`, aggregate `sum` (use `byMonth` for a monthly view — no extra stream).
- **Per-project drilldown** → bind the project perspective's dashboard variable into the `objects` filter (see [oob-content.md](oob-content.md)); the same tiles now show that project only.

Those tiles leave `groupBy` unset, so the API returns row-per-charge and the **tile** groups. The param is there for when pushing the grouping to the API pays off — set it (e.g. to `service`) and the API returns pre-aggregated rows, far fewer of them, which also keeps a wide timeframe under the [~6MB cap](#response-size-limit-6mb). Same stream either way; see [Push grouping, filtering and sorting down to the cheapest layer](#push-grouping-filtering-and-sorting-down-to-the-cheapest-layer).

### What the script keeps vs drops

The boundary is: a transformation true for **every** dashboard stays in the stream; a transformation that is **one way of looking** at the data moves to metadata or the tile.

| Stays in `cost.js` (correctness / format / scope)                  | Moves out (presentation)                                     |
| ------------------------------------------------------------------ | ------------------------------------------------------------ |
| Parse NDJSON (`response.body` → records)                           | Grouping / summing → API param if offered, else tile `group` |
| Filter to `ChargeCategory === 'Usage'` (exclude credits, taxes)    | Time bucketing → tile `byDay` grouper                        |
| If the `objects` param has a selection, filter to those project(s) | `Math.round(x * 100) / 100` → metadata `decimalPlaces: 2`    |
| Return one row per charge                                          | `.sort(...)` → [defaultShaping](#defaultshaping) or the tile |

```javascript
// cost.js — parse + correctness-filter + optional scope only; NO grouping/rounding/sorting
const records = response.body
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l) => JSON.parse(l))
    .filter((r) => r.ChargeCategory === "Usage");

// Optional `project` object-picker parameter (stream `ui` name "project").
// Selected objects arrive at context.config.project as an ARRAY (multi-select),
// each rawId a single-element array. Empty/absent → account-wide, no filter.
const unwrap = (v) => (Array.isArray(v) ? v[0] : v);
const selected = (context.config && context.config.project) || [];
const projectIds = new Set(
    selected.map((o) => unwrap(o.rawId)).filter(Boolean),
);
const scoped = projectIds.size
    ? records.filter((r) => r.Tags && projectIds.has(r.Tags.ProjectId))
    : records;

result = scoped.map((r) => ({
    date: r.ChargePeriodStart,
    projectId: (r.Tags && r.Tags.ProjectId) || "unknown",
    projectName:
        (r.Tags && r.Tags.ProjectName) ||
        (r.Tags && r.Tags.ProjectId) ||
        "unknown",
    serviceName: r.ServiceName,
    serviceCategory: r.ServiceCategory || "",
    totalCost: r.BilledCost || 0,
}));
```

> **Out-of-the-box dashboards don't suffer.** You still ship the same ready-made tiles — each one is a `cost` tile with its `group`/bucket and (for drilldown) its `objects` binding pre-configured in `defaultContent`. The five views survive as five tiles backed by one stream, not five streams.

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
        "getArgs": [{ "key": "instance", "value": "{{object.instance}}" }]
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
        ]
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

If a stream serves a real dashboarding purpose _and_ one of the above, leave it visible — the dashboard use case wins.

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

**Any string value anywhere under `config` can contain `{{ ... }}` expressions.** The server walks every string leaf of the config object and substitutes placeholders before the request is sent — there is no allowlist of fields. Common cases are `endpointPath`, `getArgs[].value`, `headers[].value`, and `postBody`, but the same syntax works in any string under `config` (e.g. a paging path, an `errorHandling.path`).

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

**Optional args and headers.** When a `getArgs` or `headers` value resolves to `null` or `undefined`, the server drops that entry from the request entirely. So `{{groupBy || null}}` sends `groupBy` only when the stream's `groupBy` param has a value and omits it otherwise — the idiom for an optional query param (and the mechanism behind [pushing optional grouping/filtering down to the API](#push-grouping-filtering-and-sorting-down-to-the-cheapest-layer)).

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

The `paging` block in `config` controls how SquaredUp fetches multiple pages.

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

If the response body is already a root-level array, omit `pathToData` entirely — the plugin iterates the root array directly. No script needed.

Works on primitives too — a string, number, or boolean at the path is returned as a single row with a `result` column.

> `rowPath` is a legacy alternative — use `pathToData` for new streams.

---

## timeframes

```json
"timeframes": false                          // current state only — no timeframe picker
"timeframes": true                           // all timeframes available (default)
"timeframes": ["last24hours", "last7days"]   // limit to specific options
```

**Canonical enum values** — these are the only valid entries in a `timeframes` array (and the only values `defaultTimeframe` accepts). Anything else fails validation with an opaque `✖ Invalid input`.

```
last1hour    last12hours   last24hours   last7days   last30days
thisMonth    thisQuarter   thisYear
lastMonth    lastQuarter   lastYear
none
```

`none` is only valid when `supportsNoneTimeframe` is set (see below).

JSON-only timeframe properties (not settable via the Save as data stream modal):

```json
"supportsNoneTimeframe": true      // adds "None" as a valid option
"defaultTimeframe": "none"         // new tiles default to "None"
"requiresParameterTimeframe": true // timeframe params always injected even without user selection
```

### Response size limit (~6MB)

The Lambda that runs a stream caps its response at ~6MB. Exceeding it surfaces as a `Function.ResponseSizeTooLarge` 500 — not a validation error. Long timeframes are the usual trigger: a wide range × a fine interval returns far more rows than a short one.

Remediation:

- **If the endpoint can group, filter, or bucket server-side, push that down** (see [Push grouping, filtering and sorting down to the cheapest layer](#push-grouping-filtering-and-sorting-down-to-the-cheapest-layer)) — pre-aggregated rows are far smaller than raw ones, and this is often the only fix when even a short timeframe overflows.
- Reduce the `pageSize` so each page (and the accumulated result) stays smaller.
- Restrict `timeframes` to the ranges the endpoint can actually return within the cap, and set a conservative `defaultTimeframe` so new tiles don't open on the largest range.
- **Apply the same restriction to every sibling stream on the same endpoint family.** If one stream on an endpoint overflows at `last30days`, its siblings hitting the same (or a heavier) endpoint will too — fixing only the one you happened to test leaves the rest broken.

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

### Column expressions

Use `valueExpression` or `formatExpression` to transform per-row data without a post-request script. Both use `{{ ... }}` syntax; inside the expression, `$['columnName']` reads the current row's value for that column.

> ⚠️ **`$['columnName']` only works for columns that are declared in `metadata`.** If the column you want to read is not listed as a metadata entry, the expression receives `undefined`. This applies to both `computed: true` and regular (non-computed) columns. If you need to derive a value from a response field that you don't want to show in the UI, declare the field in metadata with `"visible": false` so the expression can reference it.

> ⚠️ **Don't use `computed: true` just to rename a column.** A `computed` entry whose entire expression is `{{ $['otherField'] }}` is redundant — declare `otherField` directly in metadata and use `displayName` to rename it. Only use `computed: true` when the column doesn't exist in the response at all and must be synthesised (e.g. a constant `sourceType`, or a value derived from two or more other columns).

**`valueExpression`** — computes the column's **actual value**. Sorts, aggregations, shape inference, and downstream tile features all see the result.

With `"computed": true`, the column doesn't have to exist in the response — empty rows are materialized and the expression fills them. Use this to derive a new column from other columns:

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
                "error": ["Not Compliant"]
            }
        }
    ]
}
```

If the column `softwareStatus` doesn't appear in metadata, `$['softwareStatus']` is `undefined` and the expression silently returns nothing. Add it explicitly if needed:

```json
{ "name": "softwareStatus", "visible": false }
```

Without `computed: true`, `valueExpression` overrides the value of a column that's already in the response — useful for building a derived link from raw fields:

```json
{
    "name": "link",
    "valueExpression": "{{ $['status'] !== 'success' ? `https://status.example.com/#${$['id']}` : '' }}",
    "shape": ["url", { "label": "" }]
}
```

**`formatExpression`** — changes only the **displayed string** for a column. The underlying raw value is untouched, so sorting, aggregations, and rollups still operate on the original value.

Use it when the API returns a value in one unit but you want to display another, or to map enum codes to friendly labels for display only:

```json
{ "name": "download_kbps", "displayName": "Download Speed",
  "formatExpression": "{{ $['download_kbps'] / 1000 }} Mbps", "shape": "number" }

{ "name": "impact",
  "formatExpression": "{{ ({ maintenance: 'Maintenance', degradedPerformance: 'Degraded Performance' })[$['impact']] || $['impact'] }}" }
```

> If the transformed value needs to participate in math, sort, or aggregation, use `valueExpression`. `formatExpression` is display-only and the raw value still flows downstream.

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

### Wiring a script to a stream

Set `postRequestScript` inside `config` to the script's filename — **the `.js` extension is required**. Name the file after the stream's `name` field and place it in `dataStreams/scripts/`.

Stream JSON (`dataStreams/incidents.json`):

```json
{
    "name": "incidents",
    "displayName": "Incidents",
    "description": "All open incidents grouped by severity",
    "tags": ["Incidents"],
    "baseDataSourceName": "httpRequestUnscoped",
    "config": {
        "httpMethod": "get",
        "endpointPath": "incidents",
        "postRequestScript": "incidents.js"
    },
    "matches": "none",
    "metadata": [{ "pattern": ".*" }],
    "timeframes": false
}
```

Script file (`dataStreams/scripts/incidents.js`):

```javascript
// dataStreams/scripts/incidents.js
result = (data.groups || []).flatMap((group) =>
    group.items.map((item) => ({ severity: group.severity, ...item })),
);
```

> ⚠️ `pathToData` is **ignored** when `postRequestScript` is set. The script receives the raw response body as `data` regardless of `pathToData`, so leaving both configured is dead config — pick one. If a script isn't actually needed, drop it and use `pathToData` alone.

---

> ⚠️ **Don't imitate existing plugins on this.** Many shipped plugins use scripts where they shouldn't — they predate `valueExpression` / `expandInnerObjects` or were never refactored. Evaluate against the checklist below, not against precedent.

### Default: no script

Most streams that look like they need one don't. Run through this checklist first — if every line of the script you were about to write resolves to a row in this table, delete it before you write it:

| Need                                                      | Use instead                                                                              |
| --------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| Navigate to a nested array                                | `pathToData: "a.b.items"`                                                                |
| Each row is a primitive (string/number) you need to parse | `pathToData` + `valueExpression` reading `$['result']`                                   |
| Flatten one level of nested object per row                | `expandInnerObjects: true` (produces `nested.field` columns)                             |
| Constant column value per row (e.g. fixed sourceType)     | `{ "name": "sourceType", "computed": true, "valueExpression": "My Type" }`               |
| Derive one column from others on the same row             | `valueExpression: "{{ $['a'] + $['b'] }}"` (add `"computed": true` if not in response)   |
| Coerce `"unknown"` / `"n/a"` / `""` to null for a numeric | `valueExpression: "{{ ['unknown','n/a',''].includes($['x']) ? null : Number($['x']) }}"` |
| Count an array on the row                                 | `valueExpression: "{{ ($['arr'] \|\| []).length }}"`                                     |
| Rename for display only                                   | `displayName` in the column's metadata entry                                             |
| Map enum codes to friendly labels                         | `state` shape with `map` (or `formatExpression` for non-state)                           |

If a script does nothing beyond items in this table, delete it.

### When a script IS the right tool

Use scripts ONLY for transformations that can't be expressed declaratively:

- Flattening **deeply nested** (>1 level) or **array-into-rows** structures
- Filtering rows based on cross-field logic
- Deduplicating
- Joining values across rows (rankings, running totals)
- Anything that needs `_.groupBy` or similar reduce-style operations
- Parsing a **non-JSON response body** (NDJSON, CSV, plain text) — the handler only auto-parses JSON and XML (see [Parsing non-JSON responses](#parsing-non-json-responses))

Renaming, flattening single-level nesting, value coercion, adding constant columns, and `data.items.map(...)` reshapes are **never** valid reasons.

### Available globals

Scripts have access to `data`, `response` (the raw HTTP response — `.status`, `.headers`, `.body`), `context`, and **lodash** (`_`):

```javascript
// dataStreams/scripts/myStream.js
_.groupBy(items, "type");
_.uniqBy(items, "id");
_.orderBy(items, ["name"], ["asc"]);
```

### The context object

```javascript
// dataStreams/scripts/myStream.js
context.objects; // array of selected objects (their indexed properties)
context.objects[0]; // first selected object — use with httpRequestScopedSingle
context.timeframe; // { start, end, unixStart, unixEnd, interval, enum }
context.config; // current stream parameters (values set by the user in the tile)
```

> ⚠️ **`context.objects` (scope) vs `context.config.<name>` (an `objects` parameter) are different things — don't cross them.**
>
> | Source                  | Global                                                                          | Filled by                                                                                   | Shape                                                                         |
> | ----------------------- | ------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
> | **Scope**               | `context.objects`                                                               | the stream's `matches` (`httpRequestScopedSingle`) or `--object` in test mode               | array of object envelopes                                                     |
> | **`objects` parameter** | `context.config.<name>` (the field's own `name`, e.g. `context.config.project`) | a tile-editor `objects` picker, or a dashboard variable bound via `dataSourceConfig.<name>` | array of object envelopes (multi-select), each `rawId` a single-element array |
>
> A **consolidated** stream (`matches: "none"` + an optional `objects` param — see [One stream per shape](#one-stream-per-shape)) reads `context.config.<name>`, **not** `context.objects` (which is empty for it). Confusing the two means the filter silently never matches and the stream returns account-wide rows even when an object is selected.

> ⚠️ **Properties you added via `objectMapping.properties` arrive on `context.objects[N]` as arrays.** The graph stores user-defined indexed properties as multi-valued, and the script context preserves that shape — so a scalar like `url` shows up as `["https://..."]`. Templates (`{{object.url}}`) auto-unwrap single-element arrays; the script context does not. Unwrap before comparing:
>
> ```javascript
> const prop = (p) => (Array.isArray(p) ? p[0] : p);
> result = (data || []).filter((row) =>
>     (row.relatedUrls || []).includes(prop(context.objects[0]?.url)),
> );
> ```
>
> Common failure mode: `(arr || []).includes(scalar)` silently returns nothing because the script is comparing array-to-string.
>
> **Always-scalar fields** — these come from the entity envelope, not the indexed property bag, and don't need unwrapping.
>
> | Field on `context.objects[N]` | Type     | What it is                                                                                                                       |
> | ----------------------------- | -------- | -------------------------------------------------------------------------------------------------------------------------------- |
> | `id`                          | `string` | Internal graph node id                                                                                                           |
> | `sourceId`                    | `string` | Source-side id (value from `objectMapping.id`)                                                                                   |
> | `rawId`                       | `string` | The raw `objectMapping.id` value without the `sourceType~` prefix — usually what scripts want when calling the API for an object |
> | `name`                        | `string` | Display name (alias of `displayName`)                                                                                            |
> | `displayName`                 | `string` | Display name                                                                                                                     |
> | `type`                        | `string` | The `sourceType`                                                                                                                 |
> | `tenant`                      | `string` | Tenant id                                                                                                                        |
> | `configId`                    | `string` | Plugin config instance id                                                                                                        |
> | `workspaceId`                 | `string` | Workspace id (absent on workspace nodes themselves)                                                                              |
>
> Everything else — anything you added via `objectMapping.properties` in `indexDefinitions/` — needs the defensive unwrap above.

### Type primitives

Return actual JS number primitives for numeric columns — returning `"29.19"` (string) instead of `29.19` (number) causes the column to show as String type.

### Deduplication pattern

```javascript
// dataStreams/scripts/myStream.js
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

### Parsing non-JSON responses

The handler auto-parses only **JSON** and **XML** response bodies into `data`. For any other format (NDJSON, CSV, plain text), `data` is `undefined` — the handler ran `JSON.parse` on the body, it threw, and the error was swallowed. The raw text is still available as `response.body`, so parse it yourself.

NDJSON (one JSON object per line):

```javascript
// dataStreams/scripts/myStream.js
result = response.body
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .map((line) => JSON.parse(line));
```

The same approach applies to CSV or plain text — split and parse `response.body` into row objects, then assign the array to `result`.
