# ui.json Field Type Reference

## Contents

- [Overview and common properties](#overview)
- [Text inputs](#text-inputs): text, url, password, textarea, number
- [Selection inputs](#selection-inputs): checkbox, toggle, radio, switch, choiceChips, autocomplete
- [Advanced inputs](#advanced-inputs): key-value, expression, json, code, script
- [Object picker](#object-picker): objects
- [Layout](#layout): markdown, fieldGroup
- [OAuth2](#oauth2): oAuth2

---

## Overview

Defines the config form shown when a user adds the plugin. One entry per config field.

**Common properties** on all field types:

- `name` — field key, referenced as `{{fieldName}}` in expressions
- `label` — displayed in the form
- `defaultValue` — pre-populated value
- `validation` — e.g. `{ "required": true }`
- `help` — tooltip shown as a (?) icon; **supports markdown**

> ⚠️ Do **not** set a `title` attribute on fields. It is unused and should be omitted.

**`tileEditorStep`** — controls which tile editor step the field appears in. Defaults to `["Parameters"]`. Set to `["Timeframe"]` to place on the Timeframe step. **JSON-only** — cannot be set via the Save as data stream modal.

**Conditional visibility** — any field or fieldGroup can use `visible`:

```json
// Show when another field equals a specific value
{ "type": "fieldGroup", "visible": { "authMode": "basic" }, "fields": [...] }

// Show when a field matches one of several values
{ "type": "fieldGroup", "visible": { "authMode": { "type": "oneOf", "values": ["basic", "digest"] } }, "fields": [...] }
```

**`ignoreCertificateErrors`** — add to any plugin that may connect to on-prem instances with self-signed certificates:

```json
{
    "type": "checkbox",
    "name": "ignoreCertificateErrors",
    "label": "Ignore certificate errors",
    "help": "Enable when connecting to an instance with a self-signed certificate."
}
```

---

## Text inputs

**`text` / `url`** — single-line text:

```json
{
    "type": "text",
    "name": "hostname",
    "label": "Hostname",
    "placeholder": "api.example.com"
}
```

**`password`** — masked text; **use for any API key, token, secret, or password field**:

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

---

## Selection inputs

**`checkbox`** — single boolean:

```json
{
    "type": "checkbox",
    "name": "enabled",
    "label": "Enable feature",
    "defaultValue": true
}
```

**`toggle`** — boolean toggle:

```json
{
    "type": "toggle",
    "name": "advancedMode",
    "label": "Advanced Mode",
    "defaultValue": false
}
```

**`radio`** — radio button group:

```json
{
    "type": "radio",
    "name": "environment",
    "label": "Environment",
    "options": [
        { "value": "prod", "label": "Production" },
        { "value": "dev", "label": "Development" }
    ]
}
```

**`switch`** — segmented button group (like radio, different visual style):

```json
{
    "type": "switch",
    "name": "view",
    "label": "View",
    "options": [
        { "value": "table", "label": "Table" },
        { "value": "chart", "label": "Chart" }
    ]
}
```

**`choiceChips`** — chip-style selection (supports `isMulti: true`):

```json
{
    "type": "choiceChips",
    "name": "tags",
    "label": "Tags",
    "options": [
        { "value": "a", "label": "Option A" },
        { "value": "b", "label": "Option B" }
    ]
}
```

**`autocomplete`** — searchable dropdown; fixed list or data stream–driven; supports `allowCustomValues`, `isMulti`, `isClearable`:

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

> ⚠️ When using a data stream as the autocomplete source, the backing stream must return rows with `label` and `value` columns, and those columns must have `"role": "label"` and `"role": "value"` declared in the stream's metadata.

---

## Advanced inputs

**`key-value`** — list of key/value pairs (useful for custom headers, tags).

```json
{
    "type": "key-value",
    "name": "headers",
    "label": "Headers"
}
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

**`script`** — inline JavaScript editor:

```json
{
    "type": "script",
    "name": "postRequestScript",
    "label": "Script",
    "placeholder": "result = data;"
}
```

---

## Object picker

**`objects`** — searchable multi-select picker populated from **indexed SquaredUp graph objects**. Use when the items to pick from are already imported via `indexDefinitions`. For live API lookups at tile-edit time, use `autocomplete` with a data stream source instead.

> ⚠️ Only valid in data stream `ui` arrays — not in the plugin's top-level `ui.json`. Objects must already be indexed before they can be queried.

```json
{
    "type": "objects",
    "name": "workspace",
    "label": "Workspace",
    "placeholder": "Select...",
    "searchPlaceholder": "Search workspaces...",
    "matches": {
        "sourceType": {
            "type": "equals",
            "value": "Anthropic Workspace"
        }
    }
}
```

**Properties:**

| Property            | Required | Description                                                                                                                                           |
| ------------------- | -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| `name`              | ✅       | Field key — accessible as `{{name}}` in expressions                                                                                                   |
| `label`             | ✅       | Displayed label                                                                                                                                       |
| `matches`           | ✅       | Filters which graph objects appear in the picker (see below)                                                                                          |
| `placeholder`       | —        | Text shown before any selection (e.g. `"Select..."`)                                                                                                  |
| `searchPlaceholder` | —        | Text shown in the search input                                                                                                                        |
| `help`              | —        | Tooltip (supports markdown)                                                                                                                           |
| `validation`        | —        | e.g. `{ "required": true }`                                                                                                                           |
| `objectLimit`       | —        | Hard cap on how many objects the user can select. Set when your API has a per-request ID limit (e.g. `15`).                                           |
| `nodeProperties`    | —        | Graph object properties to fetch and expose in expressions/scripts. List every property you'll reference — including `name` and `sourceId` if needed. |

**Accessing the selected value:**

The field always resolves to an **array** of selected objects, each with the properties declared in `nodeProperties`:

```json
// In config expressions — map all selected objects to a property
"{{fieldName.map(o => o.sourceId).join(',')}}"

// First selected object's property
"{{fieldName[0].name}}"
```

```js
// In a postRequestScript
context.config.fieldName; // array of selected objects
```

**`matches` — filtering the picker:**

Match a single source type:

```json
"matches": {
    "sourceType": { "type": "equals", "value": "My Object Type" }
}
```

Match any of several source types using `oneOf`:

```json
"matches": {
    "sourceType": { "type": "oneOf", "values": ["Type A", "Type B"] }
}
```

Match by data source name (useful for showing all objects from a specific plugin regardless of type):

```json
"matches": {
    "sourceName": { "type": "equals", "value": "MyPlugin" }
}
```

**Advanced:** pass an array for OR logic across multiple conditions (AND within each element):

```json
"matches": [
    { "sourceType": { "type": "equals", "value": "Team" }, "usedForTickets": { "type": "equals", "value": "true" } },
    { "sourceType": { "type": "equals", "value": "Team" }, "usedForProjects": { "type": "equals", "value": "true" } }
]
```

---

## Layout

**`markdown`** — informational text block (not an input — use for instructions or notes):

```json
{
    "type": "markdown",
    "name": "info",
    "content": "**Note:** Replace the placeholder values below."
}
```

**`fieldGroup`** — groups related fields under a shared label:

```json
{ "type": "fieldGroup", "label": "Advanced Options", "fields": [ ...field definitions... ] }
```

Add `"displayAs": "fieldGroupToggle"` to make the group collapsible:

```json
{ "type": "fieldGroup", "name": "advanced", "label": "Advanced Options", "displayAs": "fieldGroupToggle",
  "fields": [ ...field definitions... ] }
```

---

## OAuth2

**`oAuth2`** — renders the OAuth2 sign-in button; used alongside `authCode` grant type in `metadata.json`:

```json
{ "type": "oAuth2", "name": "oauth2", "label": "Sign in" }
```
