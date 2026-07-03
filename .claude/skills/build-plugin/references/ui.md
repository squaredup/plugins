# ui.json Field Type Reference

## Contents

- [Overview and common properties](#overview)
- [Validation rules](#validation-rules)
- [Text inputs](#text-inputs): text, url, password, textarea, number
- [Selection inputs](#selection-inputs): checkbox, toggle, radio, switch, choiceChips, autocomplete
- [Advanced inputs](#advanced-inputs): key-value, expression, json, code, script
- [Layout](#layout): markdown, fieldGroup
- [OAuth2](#oauth2): oAuth2
- [Data-stream parameters](#data-stream-parameters): objects

---

## Overview

This defines the form fields that can be shown to a user when they either add a **plugin** or configure a **data stream**.

The **plugin** defines this within a `ui.json` file.

A **data stream** has its own `ui` array — the **tile-editor parameters** shown when a user adds that stream to a dashboard

**Common properties** on all field types:

- `name` — field key, referenced as `{{fieldName}}` in expressions
- `label` — displayed in the form
- `defaultValue` — pre-populated value
- `validation` — field validation rules like `{ "required": true }`; see [Validation rules](#validation-rules)
- `help` — tooltip shown as a (?) icon; **supports markdown**

> ⚠️ Do **not** set a `title` attribute on fields. It is unused and should be omitted.

**`tileEditorStep`** — controls which tile editor step the field appears in. Defaults to `["Parameters"]`. Set to `["Timeframe"]` to place on the Timeframe step.

**Field value shapes** — each field's value is stored under its `name`. Most store a scalar, but a few store structured shapes worth knowing when you read them back in the handler:

- `autocomplete` → an **array of `{ value }` objects**, even when single-select — not a bare string
- `key-value` → an **array of `{ key, value }` objects**
- `objects` → an array (see [Data-stream parameters](#data-stream-parameters))

**Conditional visibility** — `visible` lives on a `fieldGroup` (and `key-value`), so the idiom is to **wrap the conditionally-shown fields in a `fieldGroup`** and put `visible` on the group. A group with no `displayAs` doesn't render itself — only its children appear — so it's a zero-cost wrapper that exists purely for the condition:

```json
// Show a group of fields when another field equals a specific value
{ "type": "fieldGroup", "visible": { "authMode": "basic" }, "fields": [ ...field definitions... ] }

// Show when a field matches one of several values
{ "type": "fieldGroup", "visible": { "authMode": { "type": "oneOf", "values": ["basic", "digest"] } }, "fields": [ ...field definitions... ] }
```

> ⚠️ **Booleans match as strings here.** A `checkbox` or `toggle` does not expose a `true` value for `visible` to match against. Give a `checkbox` a string `value` and match that; match a `toggle` against `"true"`:
>
> ```json
> { "type": "checkbox", "name": "showAdvanced", "label": "Advanced options", "value": "show" },
> { "type": "fieldGroup", "visible": { "showAdvanced": "show" }, "fields": [ ...field definitions... ] }
>
> { "type": "toggle", "name": "useProxy", "label": "Use a proxy" },
> { "type": "fieldGroup", "visible": { "useProxy": "true" }, "fields": [ ...field definitions... ] }
> ```

**Disabling a field** — `disabled` greys a field out rather than hiding it. Unlike `visible`, it's a common property that works on **any field directly** (no `fieldGroup` wrapper), and takes the same match-spec form or a plain boolean:

```json
{
    "type": "text",
    "name": "region",
    "label": "Region",
    "disabled": { "useDefaults": "yes" }
}
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

## Validation rules

The `validation` object accepts [react-hook-form](https://react-hook-form.com/docs/useform/register) rules. Each rule is either a plain value (shorthand) or `{ "value": ..., "message": "..." }` to supply a custom error message:

- `required` — `true`, or `{ "value": true, "message": "..." }`
- `min` / `max` — minimum/maximum value, for `number` fields (also accepts a date string)
- `minLength` / `maxLength` — character-count bounds, for text fields
- `pattern` — a regex (as a string) the value must match
- `valueAsNumber` / `valueAsDate` — parse the raw input to a number / `Date` before validating and submitting

```json
{
    "type": "text",
    "name": "tenantId",
    "label": "Directory (tenant) ID",
    "validation": {
        "required": true,
        "minLength": { "value": 36, "message": "Must be a 36-character GUID" },
        "maxLength": 36
    }
}
```

```json
{
    "type": "text",
    "name": "serverUrl",
    "label": "Server URL",
    "validation": {
        "pattern": {
            "value": "^https://[^\\s]+$",
            "message": "Enter a valid https URL"
        }
    }
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

Choosing between them: use **`radio`** when each option reads best on its own line or needs a description; **`switch`** for a compact segmented control between 2–3 mutually exclusive modes or views; **`choiceChips`** for tag-like selection, especially multi-select (`isMulti`). For a single on/off, **`checkbox`** is the plain boolean and **`toggle`** is the same semantics with a switch appearance — reach for `toggle` when enabling a feature or revealing an advanced section.

**`checkbox`** — single boolean:

```json
{
    "type": "checkbox",
    "name": "enabled",
    "label": "Enable feature",
    "defaultValue": true
}
```

**`toggle`** — boolean, same shape as `checkbox` with `"type": "toggle"` (renders as a switch).

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

**`switch`** — same `options` shape as `radio`, with `"type": "switch"`.

**`choiceChips`** — same `options` shape as `radio`, with `"type": "choiceChips"`; add `"isMulti": true` for multi-select.

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

**`key-value`** — list of key/value pairs (useful for custom headers, tags). The basic form:

```json
{
    "type": "key-value",
    "name": "headers",
    "label": "Headers"
}
```

`verb` sets the separator drawn between key and value, `displayName` names each row, and `keyInput`/`valueInput` customise the two inputs (title, placeholder, validation):

```json
{
    "type": "key-value",
    "name": "headers",
    "label": "Headers",
    "verb": ":",
    "displayName": "header",
    "keyInput": {
        "title": "Header name",
        "placeholder": "MyHeader",
        "validation": { "required": true }
    },
    "valueInput": { "title": "Header value", "placeholder": "123" }
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

> ⚠️ When `language` is `json`, `defaultValue` must be a JSON object, not a string — the editor calls `JSON.stringify` on it. A string `defaultValue` renders as a quoted, escaped blob instead of formatted JSON.
>
> ```json
> { "type": "code", "name": "body", "language": "json", "defaultValue": { "key": "value" } }
> ```

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

## Layout

**`markdown`** — informational text block (not an input — use for instructions or notes):

```json
{
    "type": "markdown",
    "name": "info",
    "content": "**Note:** Replace the placeholder values below."
}
```

**`fieldGroup`** — groups related fields. With no `displayAs`, the group itself isn't rendered — its children appear inline, exactly as if they weren't grouped — so it's also the wrapper used for [conditional visibility](#overview) or a shared `label`:

```json
{ "type": "fieldGroup", "label": "Advanced Options", "fields": [ ...field definitions... ] }
```

**`displayAs`** controls how the group renders:

- `"fieldGroupToggle"` — a collapsible/switchable group:

    ```json
    { "type": "fieldGroup", "name": "advanced", "label": "Advanced Options", "displayAs": "fieldGroupToggle",
      "fields": [ ...field definitions... ] }
    ```

- `"row"` — lays the child fields out side by side; a child may set `columnWidth` (an `fr` unit) to control its relative width.
- `"inlineFields"` — like `row`, but child labels are hidden (e.g. an HTTP method and path on one line).
- `"tabs"` / `"tab"` — a tabbed layout. A `"tabs"` group's `fields` **must** be child `fieldGroup`s each with `"displayAs": "tab"`, or it won't render:

    ```json
    { "type": "fieldGroup", "name": "config", "displayAs": "tabs", "visible": true, "fields": [
        { "type": "fieldGroup", "displayAs": "tab", "label": "Basics",     "fields": [ ...field definitions... ] },
        { "type": "fieldGroup", "displayAs": "tab", "label": "Parameters", "fields": [ ...field definitions... ] }
    ]}
    ```

---

## OAuth2

**`oAuth2`** — renders the OAuth2 sign-in button; used alongside `authCode` grant type in `metadata.json`:

```json
{ "type": "oAuth2", "name": "oauth2", "label": "Sign in" }
```

---

## Data-stream parameters

**`objects`** — appears in a **data stream's `ui` array** (the tile-editor parameters), not the plugin's `ui.json`. It's an object picker that lets the tile filter the stream to the selected objects. Its own `matches` constrains which object types are selectable (same operators as a stream's [`matches`](data-streams.md#matches)):

```json
{
    "type": "objects",
    "name": "project",
    "label": "Project (optional)",
    "matches": {
        "sourceType": { "type": "oneOf", "values": ["Vercel Project"] }
    }
}
```

The selected objects then drive the stream at runtime:

- The selected objects arrive in the stream's [post-request script](data-streams.md#post-request-scripts) at **`context.config.<name>`** — the field's own `name`, so the example above is `context.config.project`. This is **not** `context.objects` (that is the `matches`/`--object` scope path and is empty for a consolidated stream — see [the context object](data-streams.md#the-context-object)). The value is an **array** (the picker is multi-select, and a bound dashboard variable can resolve to several objects), and each object's `rawId` is itself a single-element array. Build a Set of unwrapped `rawId`s and filter rows by membership — don't index `[0]`. Treat **empty/absent** as "no filter" so the stream still serves the account-wide case.
- **Required vs optional.** `required: true` forces a selection — use only for a stream that is _always_ per-object. Leave it **optional** when one stream should serve both account-wide (nothing selected) and per-object (something selected) use — the recommended shape for a consolidated stream.
- **Auto-scope on drilldown.** A dashboard binds its variable into this field via `dataStream.dataSourceConfig.<name>` so the stream scopes to the perspective object automatically — see [oob-content.md](oob-content.md#auto-scoping-a-stream-via-its-objects-filter). This, plus an optional filter, is what lets a single stream replace separate account and per-object streams (see [data-streams.md](data-streams.md#one-stream-per-shape)).
