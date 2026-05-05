# SquaredUp Plugin Authoring — Local Reference

## What is a SquaredUp plugin
In this repo all plugins are based on the low-code plugin (LCP) framework.
This can be seen in the repo squaredup-plugin-repository under \squaredup-plugin-repository\plugins\WebAPI\v1

A plugin is a light weight definition of how to connect, import (or index) and display data from a 3rd party application via API into SquaredUp

LCP plugins has it's own Confluence space - https://squaredup-eng.atlassian.net/wiki/spaces/LCP/overview

Out-of-the-box (OOTB) dashboards can be bundled with your plugin so users get useful content immediately on installation.

Dashboard files live in the defaultContent/ folder and follow the same format as standard SquaredUp dashboards. The captureOobContent script works the same way as for regular plugins.

When exporting your plugin, you can optionally select dashboards to include on the Dashboards tab of the export modal. If you do, make sure those dashboards only use data streams that are included in the same export.

## UI schema
The UI schema is used in two places in an LCP:
ui.json — the setup form shown when installing (adding) the plugin. Typically collects credentials.
ui array in data stream files — the form shown on the Parameters step when configuring a tile.

Both use the same field definition format.

Note: Do not set a title attribute on fields. It is not used and should be omitted.

Example — a password field for plugin setup

[
  {
    "type": "password",
    "name": "apiKey",
    "label": "API key",
    "help": "Create an API key in the [provider portal](https://example.com/api-keys)",
    "validation": {
      "required": true
    },
    "placeholder": "e.g. sk_live_xxxxxxxxxxxxxxxx"
  }
]
Example — a text field for data stream config



[
  {
    "name": "domain",
    "type": "text",
    "label": "Domain",
    "placeholder": "mydomain.com",
    "validation": {
      "required": true
    }
  }
]
Using field values in config

Reference field values in your config block using {{fieldName}} (Mustache syntax):



{
  "baseUrl": "https://api.example.com/{{apiKey}}",
  "endpointPath": "domain/{{domain}}"
}

### Accessing plugin setup (datasource) config in a data stream

Fields defined in `ui.json` (the plugin setup form) are accessible in data stream `endpointPath` and other config using the `datasource.` prefix:

```json
"endpointPath": "entry/{{dataSource.userID}}"
```

Fields defined in a data stream's own `ui` array are referenced without the prefix:

```json
"endpointPath": "entry/{{userID}}"
```

Use `{{dataSource.fieldName}}` when the value comes from plugin installation (e.g. an account ID set once for all tiles). Use `{{fieldName}}` when the value is provided per tile. In a UI section in the same .json file.

## Terminology

Plugin - The packaged integration (e.g. "My GitHub Plugin")

Data source - An installed instance of a plugin, configured with credentials

Data stream - A named query against a data source — typically maps to a single API endpoint

Base plugin - The underlying plugin your LCP is built on (almost always Web API, but could be PowerShell or something else)

Object indexing / import - Importing objects from your integration into the SquaredUp (knowledge) graph, provides global search and drilldown capabilities

OOB dashboards / default content - Out-of-the-box dashboards bundled with your plugin

## Plugin import (in-app name = indexing)
The import creates objects in a database graph for use in SquaredUp. Data streams can reference these objects.

This is the structure of the JSON files found in the indexDefinitions folder of a low-code plugin.

{
    "name": "vehicles",
    "dataStream": {
        "name": "vehicles",
        "config": {} // used as dataSourceConfig - optional
    },
    "timeframe": "none",
    "objectMapping": {
        "id": "name",
        "name": "name",
        // literal strings are always column names, use properties for values
        "type": { "value": "starwars-vehicle" },
        "properties": [
            // add a column as an object property
            "model",
            "manufacturer",
            "vehicle_class",
            // add a column as a property with a different name
            { "crewCount": "crew" },
            // convention is one property per object, but multiple also works
            { "passengerCount": "passengers" },
            { "maxSpeed": "max_atmosphering_speed" },
            // add a property with a fixed value
            { "owner": { "value": "Disney" } }
        ]
    }
}


## Plugins UX guidelines
Use this page when asked to review the format or naming conventions within the plugin
https://squaredup-eng.atlassian.net/wiki/spaces/SC/pages/26923138285589/Plugins+UX+Guidelines

### Metadata.json
Every plugin has a metadata.json file at its root. This describes the plugin and controls how it appears in the catalog.

The core fields (name, displayName, description, category, author, and icon) are set when you export from the UI. The remaining fields — notably links, keywords, and any adjustments to base.config — must be added or edited manually in the JSON after export.

Example



{
  "name": "my-plugin",
  "displayName": "My Plugin",
  "version": "1.0.0",
  "schemaVersion": "2.0",
  "category": "SquaredUp Internal",
  "type": "cloud",
  "author": {
    "type": "community",
    "name": "your-github-username"
  },
  "base": {
    "plugin": "WebAPI",
    "majorVersion": "1",
    "config": {}
  },
  "links": [
    { "category": "documentation", "url": "https://github.com/squaredup/plugins/blob/main/plugins/MyPlugin/v1/docs/README.md", "label": "Help adding this plugin" },
    { "category": "source", "url": "https://github.com/squaredup/plugins/tree/main/plugins/MyPlugin/v1", "label": "Repository" }
  ],
  "keywords": ["monitoring", "alerts", "myservice"]
}

### Data streams
A data stream typically maps to a single API endpoint. It defines what request to make, how to authenticate, how to present the response, and optionally how to let users configure the query at tile creation time.

Each data stream lives in its own JSON file inside the dataStreams/ folder of your plugin.

Basic structure

{
  "name": "person",
  "displayName": "Person",
  "description": "Details for a single person",
  "tags": ["people"],
  "baseDataSourceName": "httpRequestUnscoped",
  "config": {
    "httpMethod": "get",
    "endpointPath": "/people/{{personId}}",
    "postRequestScript": "person-post.js"
  },
  "ui": [
    {
      "label": "Person ID",
      "name": "personId",
      "type": "text"
    }
  ]
}
Other properties like timeframes and metadata can also be included; defaults are inherited from the base plugin.

Pattern-based hiding (e.g. UDF fields)
```json
{ "pattern": "udf.*", "visible": false }
```
Place before the catch-all `{ "pattern": ".*" }`. This means that all fields not specifically listed in the data stream json file, will be mapped to columns. Without this only the defined columns are shown.

## Base URL Pattern
- `metadata.json` `baseUrl` must be a plain `{{variable}}` — no path suffixes like `{{baseUrl}}/api/v2/` (the `/api/v2/` gets silently dropped)
- Put the full path prefix in each data stream's `endpointPath` instead: `"endpointPath": "api/v2/account/sites"`

## Data Stream Config

### baseDataSourceName values
| Value | Use |
|---|---|
| `httpRequestUnscoped` | No object picker — fetches globally |
| `httpRequestScoped` | Object picker — one request with all selected objects available as `{{objects}}` array |
| `httpRequestScopedSingle` | Object picker — framework automatically iterates, making one request per selected object |

### Scoped data streams
- `matches.sourceType` constrains the object picker to a specific type
- Use `{{objects[0].propertyName}}` in `endpointPath` to reference selected object properties
- **Do not use `{{sourceId}}`** — SquaredUp's `sourceId` is prefixed with the type (e.g. `Datto Site/e63d2f98-...`), which breaks URL paths
- Use a custom property stored during import instead (e.g. `{{objects[0].siteUid}}`)
- Always include a hidden `sourceId` column in scoped data stream metadata (pattern from Pingdom):
  ```json
  { "name": "sourceId", "displayName": "Object ID", "shape": "string", "visible": false }
  ```

### Paging in data streams

Two paging mechanisms are used across plugins, depending on where the API returns the next page URL:

**Next URL in response body** (e.g. Datto RMM — `pageDetails.nextPageUrl`):
```json
"paging": {
    "mode": "nextUrl",
    "pageSize": { "realm": { "value": "none", "label": "none" } },
    "in": {
        "realm": { "value": "payload", "label": "payload" },
        "path": "pageDetails.nextPageUrl"
    }
}
```

**Next URL in Link header** (e.g. GitHub — standard RFC 5988 `Link: <url>; rel="next"`):
```json
"paging": {
    "mode": "nextUrl",
    "pageSize": {
        "path": "per_page",
        "realm": { "value": "queryArg", "label": "Query parameter" },
        "value": "100"
    },
    "in": {
        "path": "next",
        "realm": { "value": "webLink", "label": "Web link" }
    }
}
```

## Metadata Shapes

### Dates (unix timestamps in ms)
```json
{ "name": "creationDate", "shape": ["date", { "timeZone": "Etc/UTC" }] }
```
Plain `"shape": "date"` also works for standard date strings.

### Numbers
```json
{ "name": "count", "shape": ["number", { "decimalPlaces": 0 }] }
```

### State with value mapping
```json
{
    "name": "status",
    "shape": ["state", {
        "map": {
            "success": ["Compliant", "up"],
            "error": ["Not Compliant", "down"],
            "warning": [],
            "unknown": [],
            "unmonitored": []
        }
    }]
}
```

### Computed/derived column
```json
{
    "name": "derivedState",
    "displayName": "Compliance State",
    "computed": true,
    "valueExpression": "{{ $['softwareStatus'] }}",
    "shape": ["state", { "map": { "success": ["Compliant"], "error": ["Not Compliant"] } }]
}
```

### Hiding fields
```json
{ "name": "uid", "shape": "string", "visible": false }
```

## Known Issues / Gotchas
- `"providesPluginDiagnostics": true` fails schema validation on the squaredup-plugin-repository pipeline — avoid or remove before submitting a PR
- `"importNotSupported": false` is not a recognised `metadata.json` field and will also fail schema validation — remove it. Import is enabled by default whenever `indexDefinitions/` is present; no flag needed to enable it.
- `*.local.json` and `*.local.md` are gitignored in this repo

## Schemas
When creating or editing a plugin file, fetch the relevant schema URL and validate your JSON against it.

| File | Schema URL |
|---|---|
| `configValidation.json` | https://s3.us-east-1.amazonaws.com/plugins.squaredup.saas/schemas/latest/configValidation.schema.json |
| `dataStream.json` (LCP) | https://s3.us-east-1.amazonaws.com/plugins.squaredup.saas/schemas/latest/dataStream.schema.json |
| `defaultDashboards.json` | https://s3.us-east-1.amazonaws.com/plugins.squaredup.saas/schemas/latest/defaultDashboards.schema.json |
| `metadata.json` | https://s3.us-east-1.amazonaws.com/plugins.squaredup.saas/schemas/latest/metadata.schema.json |
| `datastream.json` (WebAPI) | https://s3.us-east-1.amazonaws.com/plugins.squaredup.saas/schemas/latest/webapi/datastream.schema.json |


## CLI Commands
suffix is used to allow the deployment to be a unique name

```bash
squaredup status          # check login state
squaredup login --region <dev|eu|us> --stage master
squaredup deploy --suffix <suffix> --stage master   # dev only
squaredup deploy --suffix <suffix>                   # eu / us
squaredup delete <plugin-id> --stage master
```
### Custom types
JSON only — custom_types.json cannot be configured via the SquaredUp UI. It must be created and edited directly in your plugin folder.

Custom types control how your plugin's indexed objects are displayed across SquaredUp — their label, plural form, and the icon shown in global search, the graph explorer, and object drilldown pages.

File location

Create a custom_types.json file at the root of your plugin folder. It is an array with one entry per object type your plugin defines.

Example

[
    {
        "name": "My Plugin Device",
        "sourceType": "my-plugin-device",
        "icon": "server",
        "singular": "Device",
        "plural": "Devices"
    }
]
Properties

Property

Description

name

An internal label for this type. Convention is "<Plugin name> <Type label>" — e.g. "UniFi Network Device"

sourceType

Must match the type value used in your indexDefinitions/default.json objectMapping. This is how SquaredUp links the display config to actual indexed objects

icon

A Lucide icon name in lowercase kebab-case (e.g. server, wifi, hard-drive, bar-chart, key, camera)

singular

Singular display label shown in the UI — e.g. "Device"

plural

Plural display label shown in the UI — e.g. "Devices"

Relationship to object indexing

The sourceType here must match the type value assigned in your index definition. For example:

// indexDefinitions/default.json
"objectMapping": {
    "type": { "value": "my-plugin-device" },
    ...
}

// custom_types.json
{ "sourceType": "my-plugin-device", ... }
Without a matching entry in custom_types.json, indexed objects still appear in SquaredUp — they'll just use a generic icon and the raw sourceType string as their display label.

Choosing icons

Browse lucide.dev/icons to find an appropriate icon. Use the icon name in lowercase kebab-case (e.g. hard-drive, not HardDrive).

Multiple types

A plugin can define multiple types in the same file — one object per type:

[
    { "name": "My Plugin Server", "sourceType": "myPlugin-server", "icon": "server", "singular": "Server", "plural": "Servers" },
    { "name": "My Plugin Database", "sourceType": "myPlugin-database", "icon": "database", "singular": "Database", "plural": "Databases" }
]
Examples

UniFi custom_types.json — three types with different icons

FantasyPremierLeague custom_types.json

### Expressions
Expressions
In many areas of plugins, mustache-style expressions can be used for advanced configuration scenarios, e.g.

Custom columns ({{ $['value'] > 99.9 ? 'success' : 'error' }})

Custom formatting ({{ $['value'] / 100 }})

Referencing objects or timeframe in Parameters ({{timeframe.start/end}})

Mapping UI fields to Parameters ({{myFieldName}})