# Common Patterns and Custom Types

## Contents

- [custom_types.json](#custom_typesjson)
- [Built-in properties stream](#built-in-properties-stream)
- [Config validation steps](#config-validation-steps)
- [Schema references](#schema-references)

---

## custom_types.json

Adds friendly display names and FontAwesome icons per object type. The `sourceType` value must exactly match the type used in `objectMapping.type`.

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

Use **FontAwesome** icon names (`fontawesome.com/icons`), lowercase kebab-case. Common icons: `house`, `bolt`, `sun`, `battery-full`, `plug`, `thermometer`, `factory`, `gear`, `globe`, `wind`, `microchip`, `rotate`, `car`, `droplet`, `atom`, `gas-pump`, `wifi`, `camera`, `display`, `building`, `key`.

---

## Built-in properties stream

SquaredUp includes a built-in `datastream-properties` stream that automatically shows the indexed properties of any object. Use in OOB dashboards for a "Properties" or "Details" tile — no custom stream needed:

```json
"dataStream": {
    "id": "datastream-properties"
}
```

---

## Config validation steps

`configValidation.json` is optional but strongly preferred. Use a **lightweight endpoint** (e.g. `/me`, `/user`). No extra flag needed in `metadata.json` — the presence of the file is sufficient.

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

`required: true` — a failing step blocks the user from completing setup. Write error messages that name what to check, not just that something failed.

Steps can override stream parameters for validation-specific queries:

```json
{
    "displayName": "Check warehouse access",
    "dataStream": {
        "name": "sqlQuery",
        "config": { "query": "select 1", "errorOnEmptyResults": true }
    },
    "required": true,
    "error": "No warehouse access.",
    "success": "Warehouse accessible."
}
```

`errorOnEmptyResults: true` causes the step to fail if the stream returns no rows — useful when empty means access was denied.

---

## Schema references

Fetch on demand — don't load upfront:

- Data stream: `https://schemas.squaredup.com/schemas/latest/datastream.schema.json`
- Plugin metadata: `https://schemas.squaredup.com/schemas/latest/metadata.schema.json`
- Config validation: `https://schemas.squaredup.com/schemas/latest/configValidation.schema.json`
- Dashboard: `https://schemas.squaredup.com/schemas/latest/defaultContent.schema.json`
- Manifest: `https://schemas.squaredup.com/schemas/latest/manifest.schema.json`
- Scopes: `https://schemas.squaredup.com/schemas/latest/scopes.schema.json`
- UI config: `https://schemas.squaredup.com/schemas/latest/ui.schema.json`
