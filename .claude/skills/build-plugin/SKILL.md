---
name: build-plugin
description: Build a SquaredUp low-code plugin for any HTTP/REST API — from exploring the API through writing data streams, dashboards, and deploying. Use when building or extending a SquaredUp plugin.
---

# Building a SquaredUp Low-Code Plugin

This skill guides you through building a complete SquaredUp low-code plugin for any HTTP/REST API — from first exploration through to a validated, deployed plugin.

> **Scope:** This skill covers **Web API-based plugins only**. SquaredUp plugins can also be built on other data sources (e.g. PowerShell), but those are out of scope here. If the target tool does not have a usable REST API, PowerShell may be a better fit — but do not use this skill to build it. Suggest that alternative to the user and stop.

**Announce at start:** "I'm using the build-plugin skill."

---

## When to Use

- Building a new plugin for an HTTP/REST API
- Adding data streams or dashboards to an existing plugin

---

## Checklist

Create a TodoWrite task for each phase before starting:

- [ ] **Phase 1** — Explore the API
- [ ] **Phase 2** — Plan the plugin structure
- [ ] **Phase 3** — Scaffold files (`metadata.json`, `ui.json`, `icon.png`)
- [ ] **Phase 4** — Write import definitions (`indexDefinitions/default.json`)
- [ ] **Phase 5** — Write data streams
- [ ] **Phase 6** — Write OOB default content (dashboards, scopes)
- [ ] **Phase 7** — Add custom types
- [ ] **Phase 8** — Validate and deploy

---

## Phase 1: Explore the API

Before writing a single file, understand the API. **Use `AskUserQuestion` to ask the user for API documentation URLs, OpenAPI/Swagger specs, Postman collections, or any other reference material they have.** You can also search online, but verify you're looking at docs for the exact product/version the user wants to integrate. Use the docs to determine the auth mechanism, base URL, and paging approach — don't ask the user for these if they're clearly documented.

1. **Find the docs** — Gather URLs or spec files from the user (via `AskUserQuestion`), then fetch and read them. Cross-reference with any official online docs to fill gaps.
2. **Identify the object model** — What are the core entities? (e.g. installations, devices, sites). These become the **indexed objects** in SquaredUp — available for drilldown, search, scoping dashboards, and use as variables.
3. **Find the list endpoints** — Used to import objects into SquaredUp. There may be one list endpoint per type, or a single endpoint returning multiple types. Pagination is often required for larger datasets. Prefer fetching **50–250 records per page** across multiple requests rather than attempting very large pages — SquaredUp has a per-page timeout and size limit, but supports as many paged requests as needed to fetch all data.
4. **Find the data endpoints** — These power data streams. They may be scoped to a **single selected object** (e.g. metrics for one device), **multiple objects** (e.g. status across a set), or **global** (e.g. top-level account health not tied to a specific object). Identify which pattern each endpoint follows.
5. **Understand pagination** — Pagination is configured via the `paging` config block in the Web API data stream (e.g. cursor/next-token style, or offset/limit). This is a separate concern from response transformation. `pathToData` selects a specific path within the response body; a post-request script handles more advanced transformation.
6. **Note the auth pattern** — API key in header, Bearer token, OAuth2 client credentials, Basic auth? Determine this from the docs.

---

## Phase 2: Plan the Plugin Structure

Decide before writing code. **Write this plan down and share it with the user before implementing** — it surfaces scope questions early.

1. **Object types** — List every type that should appear in the SquaredUp graph (e.g. `My Service`, `My Device`). These are the values in `objectTypes` in `metadata.json` and `sourceType` throughout the plugin.
2. **Import steps** — The number of steps depends on the API. There may be a single import step that returns many object types in one response, or separate steps per type each calling their own endpoint. Let the API shape dictate the approach.
3. **Data streams** — List every stream by name, which object type(s) it targets, and what it returns. For each object type, plan:
   - A **summary/current state** stream (no timeframe, returns single row of current values)
   - A **history/metrics** stream (supports timeframes, returns time-series rows)
   - Any **cross-object** streams scoped to a parent (e.g. alarms for an installation)
   - **Prefer configurable streams** over hardcoded ones. If an API endpoint takes a parameter (e.g. a metric name), create one stream with a UI parameter rather than many streams hardcoding each value. If specific metrics are needed for OOB dashboards, specify the parameter value in the dashboard tile config, not by creating a new stream.
4. **What's intentionally omitted** — Document any API capabilities you're not implementing and why (out of scope, too complex, low value). This prevents scope creep and explains gaps.
5. **Authentication** — Document the auth mechanism and flag any user-experience concerns: is the token hard to obtain? Does it expire? Is the API heavily rate-limited in a way that affects data stream polling?
6. **OOB dashboards** — Plan a **top-level summary dashboard** (overview of the whole integration — e.g. global health, recent alerts) plus **one dashboard per object type** scoped via a dashboard variable. Dashboards that use a variable become **perspectives** when a user drills down to an object of that type, so they are especially valuable.
7. **sourceId format** — Use the **raw ID from the target system** wherever possible (e.g. the API's own numeric or string ID). Only construct a composite or generated ID if the API genuinely doesn't provide a stable unique identifier.

---

## Phase 3: File Structure

**Icon:** Do not create or generate the icon yourself. Find the official brand/product logo online (SVG preferred), or ask the user to supply one. A square icon works best. Never auto-generate a generic icon.

**configValidation.json:** Optional but strongly preferred. Wrap a simple API call (e.g. `/me`, `/user`, or any lightweight authenticated endpoint) to verify the config works on setup. For complex APIs with distinct permission scopes (e.g. AWS CloudWatch, Cost Explorer, EC2), include multiple validation steps — one per capability — so users know exactly what's working.

**scopes.json:** Only needs to include scopes that are actually used by OOB dashboards or dashboard variables. Don't add scopes speculatively.

**Folder structure:** Sub-folders under `defaultContent/` are not always named `Devices/` — use names that reflect the plugin's object model. Nested folders are supported; a good pattern is to mirror the API's own structure.

```
my-plugin/
  v1/
    metadata.json          # Plugin identity, auth, objectTypes
    ui.json                # Config form fields
    icon.svg               # Square SVG — use official brand logo, ask user if unsure
    custom_types.json      # Friendly names + FontAwesome icons per type
    configValidation.json  # Preferred: validate config on setup
    indexDefinitions/
      default.json         # Import steps
    dataStreams/
      myStream.json        # Data stream definitions
      scripts/
        myScript.js        # Post-request transform scripts
    defaultContent/
      manifest.json        # Top-level dashboard list
      scopes.json          # Scopes used by OOB dashboards only
      myDashboard.dash.json
      Installations/       # Sub-folder name reflects the object type
        manifest.json
        myDashboard.dash.json
```

---

## Phase 4: metadata.json

```json
{
    "name": "my-plugin",
    "displayName": "My Plugin",
    "version": "1.0.0",
    "author": { "name": "@yourhandle", "type": "community" },
    "description": "One sentence, max 300 chars.",
    "category": "Monitoring",
    "type": "hybrid",
    "schemaVersion": "2.0",
    "importNotSupported": false,
    "restrictedToPlatforms": [],
    "keywords": ["keyword1", "keyword2"],
    "objectTypes": ["My Installation", "My Device"],
    "links": [
        { "category": "documentation", "url": "...", "label": "Help adding this plugin" },
        { "category": "source", "url": "...", "label": "Repository" }
    ],
    "base": {
        "plugin": "WebAPI",
        "majorVersion": "1",
        "config": {
            "baseUrl": "https://api.example.com/v2",
            "authMode": "none",
            "headers": [
                { "key": "Authorization", "value": "Bearer {{accessToken}}" }
            ],
            "queryArgs": []
        }
    }
}
```

### Auth patterns

**API key in header:**
```json
"authMode": "none",
"headers": [{ "key": "X-API-Key", "value": "{{apiKey}}" }]
```

**Bearer token:**
```json
"authMode": "none",
"headers": [{ "key": "Authorization", "value": "Bearer {{accessToken}}" }]
```

**API key as query parameter:**
```json
"authMode": "none",
"queryArgs": [{ "key": "api_key", "value": "{{apiKey}}" }]
```

**Basic auth:**
```json
"authMode": "basic",
"basicAuthUsername": "{{username}}",
"basicAuthPassword": "{{password}}"
```

**Digest auth:**
```json
"authMode": "digest",
"digestAuthUsername": "{{username}}",
"digestAuthPassword": "{{password}}"
```

**OAuth2 client credentials:**
```json
"authMode": "oauth2",
"oauth2GrantType": "clientCredentials",
"oauth2TokenUrl": "https://api.example.com/oauth/token",
"oauth2ClientId": "{{clientId}}",
"oauth2ClientSecret": "{{clientSecret}}"
```

**OAuth2 authorization code** (user signs in via browser — e.g. Google Sheets, Snowflake):
```json
"authMode": "oauth2",
"oauth2GrantType": "authCode",
"oauth2AuthUrl": "https://accounts.example.com/oauth/authorize",
"oauth2TokenUrl": "https://accounts.example.com/oauth/token",
"oauth2ClientId": "{{oauth2ClientId}}",
"oauth2Scope": "read:data offline_access",
"oauth2AuthExtraArgs": [
    { "key": "response_type", "value": "code" },
    { "key": "access_type", "value": "offline" }
]
```

Token refresh is handled automatically by SquaredUp for all OAuth2 flows — no extra configuration needed.

**OAuth2 password grant** (username/password exchanged for a token — rare in modern APIs):
```json
"authMode": "oauth2",
"oauth2GrantType": "password",
"oauth2TokenUrl": "https://api.example.com/oauth/token",
"oauth2ClientId": "{{clientId}}",
"oauth2ClientSecret": "{{clientSecret}}",
"oauth2PasswordGrantUserName": "{{username}}",
"oauth2PasswordGrantPassword": "{{password}}"
```

**Advanced OAuth2 options** (provider-specific edge cases):
```json
"oauth2ClientSecretLocationDuringAuth": "body",    // "query" (default), "body", or "header"
"oauth2SendTokenInParameters": true,               // send access token as query param instead of Bearer header
"oauth2TokenExtraArgs": [{ "key": "k", "value": "v" }],     // extra token request body params
"oauth2TokenExtraHeaders": [{ "key": "k", "value": "v" }],  // extra token request headers
```

OAuth URLs and scopes support `{{fieldName}}` expressions — useful when the auth URL includes a tenant/account ID from the user's config:
```json
"oauth2AuthUrl": "https://{{accountId}}.example.com/oauth/authorize",
"oauth2Scope": "read {{role ? 'role:' + role : ''}}"
```

**Notes:**
- `author.type`: `"community"` for external contributors, `"labs"` for SquaredUp Labs plugins.
- `category`: choose from the list of available categories. Common options: `"Monitoring"`, `"Database"`, `"Security"`, `"Network"`, `"Infrastructure"`, `"Cloud Platforms"`, `"APM"`, `"CI/CD Tools"`, `"Alert Management"`, `"Issue Tracking"`, `"Collaboration"`, `"Service Management"`, `"Analytics"`, `"CRM"`, `"Version Control"`, `"CDN"`, `"Utility"`, `"Fun"`. New categories can be added, but consider whether an existing one is a close enough fit first.
- `schemaVersion`: always `"2.0"` for Low Code Plugins.
- `links` and `keywords` must be added manually — they are not populated by the export modal.
- The plugin **folder name** in the repo uses PascalCase (e.g. `MyPlugin`, `GoogleSheets`); the `name` field in `metadata.json` uses lowercase kebab-case (e.g. `my-plugin`). These are separate things.

### Plugin type

For Web API plugins, always use `"hybrid"` unless the user specifically requests otherwise.

- `"hybrid"` — cloud or on-prem agent **(default for Web API plugins)**
- `"cloud"` — SquaredUp cloud only
- `"onprem"` — agent-only

---

## Phase 5: ui.json

Defines the config form shown when a user adds the plugin. One entry per config field. All field types share these common properties:
- `name` — the field's key, referenced as `{{fieldName}}` in expressions
- `label` — displayed in the form
- `help` — tooltip text shown as a `(?)` icon
- `defaultValue` — pre-populated value
- `validation` — e.g. `{ "required": true }`
- `allowEncryption: true` — marks the field as a secret (encrypted at rest); use on any token, password, or key field
- `help` — tooltip text; **supports markdown** (links, bold, etc.)
- `tileEditorStep` — controls which tile editor step the field appears in; defaults to `["Parameters"]`. Set to `["Timeframe"]` to place a field on the Timeframe step. **JSON-only** — cannot be set via the Save as data stream modal; must be added directly to the data stream JSON file after export.

> ⚠️ Do **not** set a `title` attribute on fields. It is not used and should be omitted.

### Field types

**`text` / `url`** — single-line text input:
```json
{ "type": "text", "name": "hostname", "label": "Hostname", "placeholder": "api.example.com" }
```

**`password`** — masked text input (alternative to `text` + `allowEncryption`):
```json
{ "type": "password", "name": "apiKey", "label": "API Key" }
```

**`textarea`** — multiline text:
```json
{ "type": "textarea", "name": "query", "label": "Query", "rows": 5 }
```

**`number`** — numeric input:
```json
{ "type": "number", "name": "port", "label": "Port", "defaultValue": 443 }
```

**`checkbox`** — single boolean:
```json
{ "type": "checkbox", "name": "enabled", "label": "Enable feature", "defaultValue": true }
```

**`toggle`** — boolean toggle:
```json
{ "type": "toggle", "name": "advancedMode", "label": "Advanced Mode", "defaultValue": false }
```

**`radio`** — radio button group:
```json
{ "type": "radio", "name": "environment", "label": "Environment",
  "options": [{ "value": "prod", "label": "Production" }, { "value": "dev", "label": "Development" }] }
```

**`switch`** — segmented button group (like radio, different visual style):
```json
{ "type": "switch", "name": "view", "label": "View",
  "options": [{ "value": "table", "label": "Table" }, { "value": "chart", "label": "Chart" }] }
```

**`choiceChips`** — chip-style selection (supports `isMulti: true`):
```json
{ "type": "choiceChips", "name": "tags", "label": "Tags",
  "options": [{ "value": "a", "label": "Option A" }, { "value": "b", "label": "Option B" }] }
```

**`autocomplete`** — searchable dropdown; fixed list or driven by a data stream; supports `allowCustomValues`, `isMulti`, `isClearable`:
```json
// Fixed list
{ "type": "autocomplete", "name": "region", "label": "Region", "allowCustomValues": true,
  "data": { "source": "fixed", "values": [
    { "value": "us-east-1", "label": "US East (N. Virginia)" },
    { "value": "eu-west-1", "label": "EU West (Ireland)" }
  ]}
}

// Driven by a data stream
{ "type": "autocomplete", "name": "instance", "label": "Instance",
  "data": { "source": "dataStream", "dataStreamName": "myPlugin-listInstances",
    "dataSourceConfig": { "dataSourceName": "datasourceName" } }
}
```

> ⚠️ When using a data stream as the autocomplete source, the backing stream must return rows with `label` (string) and `value` columns, and those columns must have `"role": "label"` and `"role": "value"` declared in the stream's metadata — otherwise the dropdown won't populate correctly.

**`key-value`** — list of key/value pairs (useful for custom headers, tags):
```json
{ "type": "key-value", "name": "headers", "label": "Headers" }
```

**`expression`** — expression/template input:
```json
{ "type": "expression", "name": "filter", "label": "Filter Expression" }
```

**`json`** — JSON editor:
```json
{ "type": "json", "name": "config", "label": "Configuration" }
```

**`code`** — code editor with syntax highlighting:
```json
{ "type": "code", "name": "body", "label": "Request Body", "language": "json" }
```

**`markdown`** — informational text block (not an input — use for instructions or notes):
```json
{ "type": "markdown", "name": "info", "content": "**Note:** Replace the placeholder values below." }
```

**`script`** — inline JavaScript editor (for user-defined post-request scripts):
```json
{ "type": "script", "name": "postRequestScript", "label": "Script", "placeholder": "result = data;" }
```

**`fieldGroup`** — groups related fields together under a shared label:
```json
{ "type": "fieldGroup", "label": "Advanced Options", "fields": [ ...field definitions... ] }
```

Add `"displayAs": "fieldGroupToggle"` to make the group collapsible:
```json
{ "type": "fieldGroup", "name": "advanced", "label": "Advanced Options", "displayAs": "fieldGroupToggle",
  "fields": [ ...field definitions... ] }
```

**`oAuth2`** — renders the OAuth2 sign-in button (used alongside `authCode` grant type in `metadata.json`):
```json
{ "type": "oAuth2", "name": "oauth2", "label": "Sign in" }
```

---

## Phase 6: indexDefinitions/default.json

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
- `id` maps to the column in your data stream that holds the unique stable ID for each object. This becomes the object's `sourceId` in the graph. **The actual stored sourceId is prefixed with `sourceType~`** — so if your `id` column returns `"123"` and the type is `"My Device"`, the stored sourceId is `"My Device~123"`. Never rely on the raw ID value in expressions or endpoint paths — add it as a separate `properties` entry instead (e.g. `deviceId`) and reference `{{object.deviceId}}`.
- `name` maps to the display name column.
- `type` maps to the `sourceType` column (must match an entry in `objectTypes` in `metadata.json`).
- `type` can also be a fixed string: `{ "value": "My Device" }` — use when all rows from this stream are the same type.
- `properties` are extra fields stored on the graph node and accessible in data stream scripts as `object.propName`.
- Use `{ "targetProp": "sourceProp" }` syntax when the column name differs from the property name you want.
- The `sourceType` column value **must** match an entry in `objectTypes` — otherwise objects won't import.
- `importFrequencyMinutes` — controls how often SquaredUp re-runs the import. Defaults to `720` (12 hours).

**Import data stream pattern** — the stream called by an import step must return one flat row per object with at least `sourceId`, `name`, `sourceType`:

```javascript
// scripts/installations.js
const installations = data?.records || [];

result = installations.map((inst) => ({
    sourceId: String(inst.idSite),
    sourceType: 'My Installation',
    name: inst.name,
    siteId: String(inst.idSite),
    timezone: inst.timezone
}));
```

---

## Phase 7: Data Streams

### `baseDataSourceName` — how requests are made

**`httpRequestScopedSingle`** — SquaredUp makes **one API request per selected object** and combines the results. The user can select multiple objects; the endpoint is called separately for each. Use when the API only accepts one object per request.

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
        "getArgs": [
            { "key": "instance", "value": "{{object.instance}}" }
        ],
        "postRequestScript": "batterySummary.js"
    },
    "matches": {
        "sourceType": { "type": "oneOf", "values": ["My Battery"] }
    },
    "metadata": [
        { "name": "voltage", "displayName": "Voltage", "shape": "number" },
        { "name": "current", "displayName": "Current", "shape": "number" },
        { "name": "stateOfCharge", "displayName": "State of Charge", "shape": "number" }
    ],
    "timeframes": false
}
```

**`httpRequestScoped`** — SquaredUp makes **one API request** regardless of how many objects are selected. All selected objects are available via `{{objects}}`. Use when the API accepts multiple objects in a single request (e.g. as a filter or comma-separated list), or when the endpoint naturally summarises across multiple objects.

```json
{
    "name": "deviceStatus",
    "displayName": "Device Status",
    "description": "Status across selected devices",
    "baseDataSourceName": "httpRequestScoped",
    "config": {
        "httpMethod": "get",
        "endpointPath": "devices/status",
        "getArgs": [
            { "key": "ids", "value": "{{objects.map(o => o.deviceId).join(',')}}" }
        ],
        "postRequestScript": "deviceStatus.js"
    },
    "matches": {
        "sourceType": { "type": "oneOf", "values": ["My Device"] }
    },
    "metadata": [
        { "name": "name", "displayName": "Device", "shape": "string", "role": "label" },
        { "name": "status", "displayName": "Status", "shape": "state" }
    ],
    "timeframes": false
}
```

**`httpRequestUnscoped`** — no object selection at all. The stream makes a single request with no object context. Use for global/account-level endpoints (e.g. top-level alerts, account summary). Pair with `"matches": "none"`.

```json
{
    "name": "accountAlerts",
    "displayName": "Account Alerts",
    "baseDataSourceName": "httpRequestUnscoped",
    "config": {
        "httpMethod": "get",
        "endpointPath": "alerts"
    },
    "matches": "none"
}
```

**Choosing between them:** Use `httpRequestScopedSingle` when the API only supports one object at a time. Use `httpRequestScoped` when the API accepts multiple objects in one call. Use `httpRequestUnscoped` for endpoints that need no object context at all.

**Stream naming:** The `name` field is the internal identifier. It is derived by camelCasing the display name (e.g. `"CPU Usage"` → `cpuUsage`). Keep it stable — renaming a stream is a breaking change.

**`description`:** One sentence, no full stop at the end.

**`tags`:** Required. Array of strings shown in the UI — use title case (e.g. `"Battery"`, `"Energy"`, not `"battery"`). Don't add too many; group streams within a plugin effectively under a small set of tags.

### `matches` — whether the user picks objects

`matches` controls whether SquaredUp asks the user to select objects before running the stream. Match criteria should target a **single object type**. Do not match multiple types in one stream.

```json
// User picks objects of a specific type
"matches": { "sourceType": { "type": "oneOf", "values": ["My Device"] } }

// User picks any object from any plugin
"matches": "all"

// No object selection — stream is global (e.g. account-level metrics, top-level alerts)
"matches": "none"
```

Available match operators on any property: `oneOf`, `notOneOf`, `contains`, `notContains`, `equals`, `notEquals`, `regex`, `notRegex`, `any`.

### Expressions in `endpointPath` and `getArgs`

Expressions support **inline JavaScript**, so you can use any JS expression inside `{{ }}`:

```
{{objects.map(o => o.siteId).join(',')}}   // comma-separated list of siteIds
{{paramName.split('/')[0]}}                // first segment of a slash-delimited param
{{object.name.toLowerCase()}}              // transform a property value
```

| Expression | Resolves to |
|---|---|
| `{{dataSource.fieldName}}` | A field from the plugin's top-level `ui.json` config |
| `{{paramName}}` | A field from the data stream's own `ui` config (parameterised streams) |
| `{{object.propName}}` | A property on the matched object (`httpRequestScopedSingle`) |
| `{{objects}}` | Array of selected objects (`httpRequestScoped`) |
| `{{variable1}}` | The selected object(s) from a dashboard variable — useful when you need object properties in an API parameter, e.g. `{{variable1[0].name}}` |
| `{{timeframe.start}}` / `{{timeframe.end}}` | Timeframe as **ISO 8601 strings** |
| `{{timeframe.unixStart}}` / `{{timeframe.unixEnd}}` | Timeframe as **Unix epoch seconds** |
| `{{timeframe.interval}}` | Suggested data resolution, e.g. `PT1M`, `PT1H` |
| `{{timeframe.enum}}` | Timeframe name, e.g. `last24hours` (rarely needed externally) |

**Example — parameterised stream** (avoids creating one stream per metric):
```json
{
    "name": "deviceMetric",
    "displayName": "Device Metric",
    "ui": [
        { "name": "metric", "displayName": "Metric Name", "type": "text" }
    ],
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

In OOB dashboard tiles, set the stream parameter in the tile's `dataStream` config rather than hardcoding it in the stream definition.

### POST requests

For APIs that require a request body, use `"httpMethod": "post"` and `postBody`:

```json
"config": {
    "httpMethod": "post",
    "endpointPath": "queries/_search",
    "postBody": "{{query}}"
}
```

`postBody` can be a template string (as above) or a JSON object with expressions:
```json
"postBody": {
    "statement": "{{query}}",
    "database": "{{typeof database !== 'undefined' ? database : undefined}}"
}
```

### `expandInnerObjects`

```json
"config": {
    "expandInnerObjects": true,
    ...
}
```

Flattens nested objects in the response into dot-notation column names (e.g. a nested `{ "patchManagement": { "patchesInstalled": 5 } }` becomes column `patchManagement.patchesInstalled`). Useful when the API returns rich nested objects you want to expose as flat columns without writing a post-request script.

### `manualConfigApply`

```json
"manualConfigApply": true
```

When set, the tile shows an **Apply** button rather than running on every config change. Use for streams with expensive or slow queries (e.g. database queries, large search requests) where auto-executing on each keystroke would be disruptive.

### Pagination (`paging`)

The `paging` block in `config` controls how SquaredUp fetches multiple pages.

**No paging (single page):**
```json
"paging": { "mode": "none" }
```

**Next-URL** — API returns a URL for the next page in the response body or a header:
```json
"paging": {
    "mode": "nextUrl",
    "pageSize": {
        "realm": "queryArg",   // "queryArg", "header", or "body" (POST only)
        "path": "max",         // parameter name
        "value": "100"
    },
    "in": {
        "realm": "payload",    // "payload" (body), "header", or "webLink"
        "path": "pageDetails.nextPageUrl"  // path to the next URL in the response
    }
}
```

**Token** — API returns a cursor/token in the response which is sent with the next request:
```json
"paging": {
    "mode": "token",
    "pageSize": { "realm": "queryArg", "path": "limit", "value": "100" },
    "in": {
        "realm": "payload",    // "payload" or "header"
        "path": "meta.next_cursor"
    },
    "out": {
        "realm": "queryArg",   // "queryArg", "header", or "body" (POST)
        "path": "cursor"
    }
}
```

**Offset** — increments a page number or row offset on each request:
```json
"paging": {
    "mode": "offset",
    "pageSize": { "realm": "queryArg", "path": "limit", "value": "100" },
    "offset": {
        "mode": "page",        // "page" (increments 1,2,3...) or "row" (increments by page size)
        "rowCountIn": {
            "realm": "payloadArraySize",  // "payloadArraySize", "payload", or "header"
            "path": "items"               // path to array (payloadArraySize) or count (others)
        },
        "base": 1              // starting page/row (usually 0 or 1)
    },
    "out": {
        "realm": "queryArg",   // where to send the page number / row offset
        "path": "page"
    }
}
```

### `errorHandling`

By default, SquaredUp shows the HTTP status code and error body to the user. You can customise this:

```json
// Extract error message from a specific response field
"errorHandling": { "type": "path", "realm": "payload", "path": "error.message" }

// Custom error handling script — access `response` (.status, .body) and `data`
"errorHandling": { "type": "script", "script": "result = response.status + ': ' + data.error;" }
```

`realm` for `path` mode: `"payload"` (body) or `"header"`.

### `pathToData` — navigating the response envelope

If the API returns `{ "data": { "items": [...] } }`, use `pathToData` in the stream config to point at the array:
```json
"config": {
    "httpMethod": "get",
    "endpointPath": "devices",
    "pathToData": "data.items"
}
```
Each element of the resolved array becomes one row. For more complex response transformation, use a `postRequestScript` instead.

> `rowPath` is a legacy alternative — use `pathToData` for new streams.

### `timeframes`

```json
"timeframes": false          // Current state only, no timeframe picker shown
"timeframes": true           // All timeframes available (default)
"timeframes": ["last24hours", "last7days"]  // Limit to specific options
```

For current-state streams (live device metrics, status), always use `"timeframes": false`.

Three additional **JSON-only** timeframe properties (cannot be set via the Save as data stream modal):
```json
"supportsNoneTimeframe": true      // Adds "None" as a valid timeframe option
"defaultTimeframe": "none"         // New tiles default to "None" ("none" or "dashboard")
"requiresParameterTimeframe": true // Timeframe params are always injected even without a user selection
```

### `defaultShaping`

Sets default sort/group/aggregate behaviour when a tile is first added. Users can override it via the tile editor.

```json
"defaultShaping": {
    "sort": {
        "by": [["rank", "asc"]]
    }
}
```

### `metadata` — column definitions

Always use `displayName` to give columns human-readable labels. Column names in scripts are often terse API field names — `displayName` is what users see in the UI.

```json
{ "name": "voltage", "displayName": "Voltage (V)", "shape": "number" }
{ "name": "status", "displayName": "Status", "shape": "state" }
{ "name": "label", "displayName": "Name", "shape": "string", "role": "label" }
{ "name": "ts", "displayName": "Time", "shape": "string", "role": "timestamp" }
{ "name": "id", "displayName": "ID", "shape": "string", "visible": false }
{ "pattern": ".*" }   // catch-all: include all columns, infer types from values
```

**Column inclusion — choose one approach:**
- **All columns**: include `{ "pattern": ".*" }` as the last entry. All columns from your script result are available.
- **Explicit set only**: list each column by `name` and omit the pattern. Unlisted columns are hidden.
- **Mix**: list specific columns with shapes/roles, then add the pattern to catch the rest.

**Type inference:** SquaredUp infers column types from the actual JS primitive returned by the script (`number`, `string`, `boolean`). For dynamic columns (via pattern), return the correct primitive type from your script — don't coerce to string. Declared `shape` overrides inference.

**Available shapes:**

*Value*
| Shape | Notes |
|---|---|
| `"string"` | Plain text |
| `"number"` | Numeric. Options: `decimalPlaces` (0–10), `thousandsSeparator` (boolean) |
| `"boolean"` | Boolean |

*Time*
| Shape | Notes |
|---|---|
| `"date"` | Date/datetime. Options: `format` (e.g. `"dd/MM/yyyy"`), `timeZone`, `inputPattern` |
| `"seconds"` | Duration in seconds. Options: `formatDuration` (boolean), `decimalPlaces` |
| `"milliseconds"` | Duration in milliseconds. Options: `formatDuration`, `decimalPlaces` |
| `"minutes"` | Duration in minutes. Options: `formatDuration`, `decimalPlaces` |

*Math*
| Shape | Notes |
|---|---|
| `"percent"` | Percentage 0–100. Options: `asZeroToOne` (multiply by 100 before display) |

*Data size* (auto-scale using 1024 factors)
`"bytes"`, `"kilobytes"`, `"megabytes"`, `"gigabytes"`, `"terabytes"`, `"petabytes"`, `"exabytes"`, `"zettabytes"`, `"yottabytes"`

*Data rates* (auto-scale; choose the appropriate base unit)
- Metric bit rates (×1000): `"bitspersecondmetric"`, `"kilobitspersecond"`, `"megabitspersecond"`, `"gigabitspersecond"`, `"terabitspersecond"`
- Binary bit rates (×1024): `"bitspersecondbinary"`, `"kibibitspersecond"`, `"mebibitspersecond"`, `"gibibitspersecond"`, `"tebibitspersecond"`
- Decimal byte rates (×1000): `"bytesperseconddecimal"`, `"kilobytespersecond"`, `"megabytespersecond"`, `"gigabytespersecond"`, `"terabytespersecond"`
- Binary byte rates (×1024): `"bytespersecondbinary"`, `"kilobytespersecondbinary"`, `"megabytespersecondbinary"`, `"gigabytespersecondbinary"`, `"terabytespersecondbinary"`

*Currency*
| Shape | Notes |
|---|---|
| `"usd"` | USD ($) |
| `"eur"` | EUR (€) |
| `"gbp"` | GBP (£) |
| `"currency"` | Any currency. Options: `code` (ISO 4217, e.g. `"jpy"`) |

*Special*
| Shape | Notes |
|---|---|
| `"state"` | Health dot. Values: `success`, `warning`, `error`, `unknown`, `unmonitored`. Options: `map` (object mapping raw values to state keys) |
| `"url"` | Hyperlink. Options: `label` (static string or template e.g. `"{{column.name}}"`) |
| `"json"` | JSON display |
| `"guid"` | GUID |
| `"customunit"` | Custom unit label. Options: `prefix`, `separator` |

**Array form** — use when you need formatting options:
```json
{ "name": "price", "shape": ["number", { "decimalPlaces": 2 }] }
{ "name": "expiry", "shape": ["date", { "format": "dd/MM/yyyy" }] }
{ "name": "updatedAt", "shape": ["date", { "format": "dd/MM/yyyy hh:mm", "timeZone": "Etc/UTC" }] }
{ "name": "health", "shape": ["state", { "map": { "success": ["ok","active"], "error": ["failed","down"], "warning": ["degraded"] } }] }
{ "name": "cost", "shape": ["currency", { "code": "jpy" }] }
```

Fetch the datastream schema for full options on any shape when needed.

**Computed columns** — derive a column value from another column using a `valueExpression`, rather than from the raw response. Useful for mapping a raw API field to a `state` shape without a post-request script:
```json
{
    "name": "complianceState",
    "displayName": "Compliance State",
    "computed": true,
    "valueExpression": "{{ $['softwareStatus'] }}",
    "shape": ["state", {
        "map": { "success": ["Compliant"], "error": ["Not Compliant"], "warning": [], "unknown": [] }
    }]
}
```

**Date/timestamp columns:** The platform automatically interprets Unix timestamps (seconds or ms) and ISO 8601 strings. Any other format must either be converted in a script or configured with an input format in metadata. Declare the column with `"role": "timestamp"` so the platform knows to treat it as a time axis.

**Roles:**

| Role | Description |
|---|---|
| `label` | Primary display name for the row |
| `value` | Primary data value (used by scalar tiles) |
| `timestamp` | Time axis column for line graphs |
| `id` | Unique row identifier |
| `sourceId` | Object identifier — enables drilldowns when paired with a fixed `sourceType` |
| `link` | Hyperlink or navigation field |
| `unitLabel` | Measurement unit identifier |
| `comparison` | Enables comparative analysis between values |
| `computed` | Derived or calculated field |
| `description` | Supplementary explanatory content |
| `none` | No specific semantic role |

**Drilldown metadata entry** — links a column value to an object in the graph:
```json
{
    "sourceId": "deviceId",    // column whose value is the sourceId
    "sourceType": "My Device", // MUST be a fixed string — cannot be dynamic
    "name": "deviceName"       // column to use as the display name
}
```
> ⚠️ `sourceType` must be a hardcoded string. Dynamic per-row sourceType is not supported. If a stream returns rows from multiple object types, drilldowns are not possible.

---

## Phase 8: Post-Request Scripts

Scripts run after the HTTP response is received. The input is `data` (the parsed JSON body). Set `result` to an array of row objects.

Scripts have a slight performance penalty. **Only use a script when the response genuinely needs structural transformation.** Avoid scripts for:
- **Renaming or labelling columns** — use `displayName` in metadata instead
- **State mapping** (e.g. `"ok" → "success"`, `true → "success"`) — use the `state` shape with a `map` option instead
- **Simple path selection** (e.g. extracting `data.records`) — use `pathToData` in the stream config instead

Use scripts for: flattening nested structures, filtering rows, deduplicating, joining multiple response fields, or computing derived values the API doesn't provide directly.

### Available globals

Scripts have access to `data`, `context`, and **lodash** (`_`):

```javascript
_.groupBy(items, 'type')
_.uniqBy(items, 'id')
_.orderBy(items, ['name'], ['asc'])
```

### The `context` object

Scripts have access to a `context` object alongside `data`:

```javascript
context.objects        // array of selected objects (their indexed properties)
context.objects[0]     // first selected object — use with httpRequestScopedSingle
context.timeframe      // current timeframe: { start, end, unixStart, unixEnd, interval, enum }
context.config         // current stream parameters (values set by the user in the tile)
```

Example:
```javascript
const instance = context.objects[0]?.instance;
const siteId = context.objects[0]?.siteId;
const metric = context.config?.metric;
const since = context.timeframe?.unixStart;
```

### Deduplication (import streams)

```javascript
const seen = new Set();
const devices = [];

for (const record of data?.records || []) {
    const key = `${record.type}-${record.instance}`;
    if (seen.has(key)) continue;
    seen.add(key);
    devices.push({ sourceId: key, name: record.name, sourceType: 'My Device' });
}

result = devices;
```

### Type primitives

Return actual JS number primitives for numeric columns — SquaredUp infers the column type from the value. Returning `"29.19"` (string) instead of `29.19` (number) will cause the column to show as String type.

---

## Phase 9: OOB Default Content

Default content is available to users when they install a plugin — it is not copied in as a snapshot. It updates when the plugin changes, though there can be a delay due to caching. To see changes immediately, reinstall the plugin.

### scopes.json

One scope per object type — used to populate tile scope pickers in dashboards:

```json
[
    {
        "name": "Installations",
        "matches": { "sourceType": { "type": "oneOf", "values": ["My Installation"] } },
        "variable": {
            "name": "Installation",
            "allowMultipleSelection": false,
            "default": "none"
        }
    },
    {
        "name": "Devices",
        "matches": { "sourceType": { "type": "oneOf", "values": ["My Device"] } },
        "variable": {
            "name": "Device",
            "allowMultipleSelection": false,
            "default": "none"
        }
    }
]
```

### manifest.json

```json
{
    "items": [
        { "name": "installationOverview", "type": "dashboard" },
        { "name": "Devices", "type": "folder" }
    ]
}
```

Folders map to sub-directories. Each sub-directory needs its own `manifest.json`.

### Dashboard layout

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
                "x": 0, "y": 0, "w": 2, "h": 4,
                "moved": false, "static": false, "z": 0,
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
                        "config": {
                            "data-stream-table": {
                                "transpose": true
                            }
                        }
                    }
                }
            }
        ]
    }
}
```

**Dashboard rules:**
- `"variables"` array supports **only one variable** per dashboard. Design each dashboard around a single object type.
- Omit `"timeframe"` on tiles to inherit the dashboard timeframe — do not hardcode `"last24hours"` on tiles.
- All tile IDs (`"i"`) must be unique UUIDs within the dashboard.

**Grid layout:**
- The `columns` value can be any number — choose what suits the layout.
- `w` + `x` must not exceed the column count.
- `h=2` works well for most tiles; adjust as needed to create a balanced layout.
- Side-by-side pairing: attributes table `w=1, x=0` + chart `w=3, x=1` at same `y`.

**Visualisation types:**

**Table** — use `transpose: true` for key-value single-row data:
```json
{
    "type": "data-stream-table",
    "config": { "data-stream-table": {
        "transpose": false,
        "columnOrder": ["name", "status", "value"],
        "hiddenColumns": ["id", "internalKey"],
        "columnDisplayNames": { "ts": "Timestamp" },
        "resizedColumns": { "columnWidths": { "name": 250 } }
    }}
}
```

**Line graph:**
```json
{
    "type": "data-stream-line-graph",
    "config": { "data-stream-line-graph": {
        "xAxisColumn": "timestamp",
        "yAxisColumns": ["value", "baseline"],
        "seriesColumn": "none",
        "showLegend": true,
        "legendPosition": "bottom",
        "yAxisLabel": "Response time (ms)",
        "showYAxisLabel": true,
        "showTrendLine": false
    }}
}
```

**Bar chart:**
```json
{
    "type": "data-stream-bar-chart",
    "config": { "data-stream-bar-chart": {
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
    }}
}
```

**Scalar** — single value/KPI:
```json
{
    "type": "data-stream-scalar",
    "config": { "data-stream-scalar": {
        "value": "columnName",
        "comparisonColumn": "none",
        "label": "Custom Label",
        "manualSize": 50,
        "formatted": false
    }}
}
```

**Donut chart:**
```json
{
    "type": "data-stream-donut-chart",
    "config": { "data-stream-donut-chart": {
        "valueColumn": "count",
        "labelColumn": "category",
        "hideCenterValue": false,
        "showValuesAsPercentage": true,
        "legendPosition": "auto",
        "legendMode": "table"
    }}
}
```

**Blocks** — health/status grid:
```json
{
    "type": "data-stream-blocks",
    "config": { "data-stream-blocks": {
        "labelColumn": "name",
        "stateColumn": "state",
        "sublabel": "status",
        "linkColumn": "none",
        "columns": 4
    }}
}
```

**Gauge:**
```json
{
    "type": "data-stream-gauge",
    "config": { "data-stream-gauge": {
        "value": { "type": "arr", "columns": ["columnName"] },
        "label": "Optional label",
        "minimum": 0,
        "maximum": 100,
        "minimumColumn": "minCol",
        "maximumColumn": "maxCol"
    }}
}
```
`value` can be:
- `{ "type": "arr", "columns": ["col"] }` — value from a specific column
- `{ "type": "count" }` — count of rows
- `{ "type": "sum", "columns": ["col"] }` — sum of a column
- `{ "type": "mean", "columns": ["col"] }` — mean of a column

`minimum`/`maximum` set fixed gauge bounds; `minimumColumn`/`maximumColumn` read bounds from data columns.

**Embed** — image or iframe:
```json
{
    "type": "tile/embed",
    "config": { "tile/embed": {
        "src": "https://example.com/embed",
        "title": ""
    }}
}
```

**Templating tokens available in dashboards:**
- `{{configId}}` — the plugin config instance ID
- `{{workspaceId}}` — current workspace
- `{{scopes.[ScopeName]}}` — references a scope by name from `scopes.json`
- `{{dataStreams.[streamName]}}` — resolves to the data stream's ID
- `{{variables.[VariableName]}}` — references the variable defined on a scope

---

## Phase 10: custom_types.json

Adds friendly display names and FontAwesome icons per object type. The `sourceType` value must exactly match the type value used in the indexing definition (`objectMapping.type`) — it's the same string that identifies objects in the graph.

```json
[
    {
        "name": "My Installation",
        "sourceType": "My Installation",
        "icon": "house",
        "singular": "Installation",
        "plural": "Installations"
    },
    {
        "name": "My Device",
        "sourceType": "My Device",
        "icon": "microchip",
        "singular": "Device",
        "plural": "Devices"
    }
]
```

Use **FontAwesome** icon names (see `fontawesome.com/icons`), in lowercase kebab-case — e.g. `house`, `bolt`, `sun`, `battery-full`, `plug`, `thermometer`, `factory`, `gear`, `globe`, `wind`, `microchip`, `rotate`, `car`, `droplet`, `atom`, `gas-pump`, `wifi`, `camera`, `display`, `building`, `key`.

---

## Phase 11: Validate & Deploy

**Prerequisites:** Node.js 22 or later.

```bash
# Login (interactive)
squaredup login

# Login (non-interactive, for CI)
squaredup login --apiKey <key> --region eu   # regions: us, eu, dev

# Check login status
squaredup status

# Deploy from the plugin's versioned directory (e.g. my-plugin/v1/)
squaredup deploy --suffix <yourname>   # suffix namespaces your deployment (e.g. initials)

# Global flags
squaredup --debug    # verbose output
squaredup --silent   # suppress output
```

The CLI will prompt for confirmation if a plugin with the same name and suffix already exists.

Always validate before deploying. The validator catches: missing required fields, unknown keys, invalid matches syntax, broken dashboard references.

**Versioning:** New plugins start at `1.0.0`. Use semver:

| Change type | Bump |
|---|---|
| Bug fix, docs, icon, metadata tweak | PATCH (`1.0.x`) |
| New stream, new optional config field, new default content | MINOR (`1.x.0`) |
| Deleted/renamed stream, breaking config change | MAJOR (`x.0.0`) |

Every PR that modifies plugin files must include a version bump. For breaking (MAJOR) changes, **do not create a new major version without asking the user first** — it is often possible to avoid the breaking change entirely with a different approach. If a major version is genuinely needed, create a new versioned folder (e.g. `v2/`) rather than modifying `v1/`, preserving the existing version for users who haven't migrated. When removing a stream, mark it `deprecated` in one release, then remove it in a follow-up major bump.

---

## Common Patterns

### Built-in properties stream

SquaredUp includes a built-in `datastream-properties` data stream that automatically shows the properties of any indexed object (the fields captured in `properties` during import). Use this in OOB dashboards for a "Properties" or "Details" tile without writing a custom stream:

```json
"dataStream": {
    "name": "datastream-properties"
}
```

### Stream visibility

```json
// Hide from UI entirely
"visibility": { "type": "hidden" }

// Mark as deprecated — hidden and flagged; include a reason to guide users
"visibility": { "type": "deprecated", "reason": "Use deviceMetrics instead" }
```

### Object property lookup in metadata

Replace a raw ID column with a human-readable property from a related indexed object, using `objectPropertyPath`. Optionally combine properties using `valueExpression`:

```json
// Replace AgentID column value with the agent's name from the graph
{ "name": "AgentName", "sourceId": "AgentID", "sourceType": "my-agent", "objectPropertyPath": "name" }

// Combine properties into a custom display string
{ "name": "AgentLabel", "sourceId": "AgentID", "sourceType": "my-agent",
  "objectPropertyPath": "name", "valueExpression": "{{ object.name }} ({{ object.company }})" }
```

### Config validation

Add a `configValidation.json` file to test connectivity when a user sets up the plugin. No extra flag is needed in `metadata.json` — the presence of the file is sufficient. Use a **lightweight endpoint** (e.g. `/me`, `/user`) — avoid calls that return large datasets.

```json
{
    "steps": [
        {
            "displayName": "Authenticate",
            "dataStream": { "name": "currentUser" },
            "required": true,
            "error": "Could not authenticate. Check your API key has the required scopes.",
            "success": "Connected successfully."
        },
        {
            "displayName": "Check data access",
            "dataStream": { "name": "installations" },
            "required": false,
            "error": "Authenticated but no installations found.",
            "success": "Installations accessible."
        }
    ]
}
```

`required: true` — a failing step blocks the user from completing setup. Write error messages that tell the user what to check (e.g. specific scopes needed), not just that something failed.

Each step's `dataStream` block can include a `config` object to override stream parameters — useful when the validation stream is parameterised (e.g. a SQL query stream):
```json
{
    "displayName": "Check warehouse access",
    "dataStream": {
        "name": "sqlQuery",
        "config": {
            "query": "select 1",
            "errorOnEmptyResults": true
        }
    },
    "required": true,
    "error": "No warehouse access.",
    "success": "Warehouse accessible."
}
```

`errorOnEmptyResults: true` in the config causes the step to fail if the stream returns no rows — useful for permission checks where an empty result means access was denied.

---

## Schema References

**Fetch schemas on demand** — don't load all of them upfront. When you're unsure about valid field names, allowed values, or required properties for a specific file type, fetch the relevant schema with `WebFetch` and check it. `squaredup validate` is the primary correctness check; schemas are for resolving specific ambiguities.

- Data stream: `https://schemas.squaredup.com/schemas/latest/datastream.schema.json`
- Plugin metadata: `https://schemas.squaredup.com/schemas/latest/metadata.schema.json`
- Config validation: `https://schemas.squaredup.com/schemas/latest/configValidation.schema.json`
- Dashboard: `https://schemas.squaredup.com/schemas/latest/defaultContent.schema.json`
- Manifest: `https://schemas.squaredup.com/schemas/latest/manifest.schema.json`
- Scopes: `https://schemas.squaredup.com/schemas/latest/scopes.schema.json`
- UI config: `https://schemas.squaredup.com/schemas/latest/ui.schema.json`
- Example plugins: `plugins/` directory in this repository
