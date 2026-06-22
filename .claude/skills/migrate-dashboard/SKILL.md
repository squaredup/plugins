---
name: migrate-dashboard
description: Migrate an exported platform dashboard JSON to plugin format. Use when the user pastes a dashboard JSON to convert, says "migrate this dashboard", or wants to add an exported dashboard to a plugin as default content.
model: sonnet
metadata:
    author: SquaredUp
    version: "0.0.1"
---

# Migrate Dashboard to Plugin Format

Convert a platform-exported dashboard JSON to plugin format by normalizing hardcoded IDs to template variables, then saving as plugin default content.

**Announce at start:** "I'm using the migrate-dashboard skill."

---

## Steps

### 1. Locate plugin

Identify the plugin and version from context, or ask the user.

Working folder: `plugins/<Name>/<version>/`

If only one version exists, use it without asking.

**Done when:** working folder is set.

---

### 2. Receive dashboard JSON

Ask the user to paste the exported dashboard JSON if not already provided.

**Done when:** valid JSON with `"_type": "layout/grid"` is in hand.

---

### 3. Normalize

Run the normalization script to replace all hardcoded platform values with template variables:

```bash
node .claude/skills/migrate-dashboard/scripts/normalize.js <dashboard.json> [plugins/<Name>/<version>/defaultContent/scopes.json] [--scope-name "Scope Name"]
```

Pass `scopes.json` when the dashboard has tiles with `config.variables` or `config.scope` (perspective dashboard). The script reads `config.dataStream.name` from each tile to generate the correct `{{dataStreams.[name]}}` reference.

If `scopes.json` has multiple entries, read it first and determine which scope applies. It may be obvious from the dashboard content (e.g. tile titles referencing "Agent" or "Organization"), but if not, ask the user before running the script. Pass the chosen scope via `--scope-name "Scope Name"`. Run once per scope if the dashboard mixes tiles from multiple scopes.

Verify the output — check that:

- No `config-*` IDs remain (all → `{{configId}}`)
- No `space-*` IDs remain (all → `{{workspaceId}}`)
- All `config.dataStream.id` values are `{{dataStreams.[name]}}` form, **except** the global built-in `datastream-properties`, which is left as-is
- All `config.activePluginConfigIds` are `["{{configId}}"]`
- `dashboard.version` is reset to `1` (the script forces this regardless of the pasted-in version)
- `config.scopes[]` entries with `ids_defaultScopeIds` bindings are removed
- Perspective tiles: `config.variables`, `config.scope.variable`, `config.scope.scope` are templatized
- The tiles x/y/z positions have not been changed from the pasted dashboard JSON

**Done when:** no hardcoded platform IDs remain in any tile.

---

### 4. Confirm title and timeframe

Ask the user to confirm the dashboard title (suggest one derived from the content).

Ask for timeframe. Default: `last24hours`. Options:

`last1hour` · `last12hours` · `last24hours` · `last30days` · `thisMonth` · `thisQuarter` · `thisYear` · `lastMonth` · `lastQuarter` · `lastYear` · `none`

**Done when:** title confirmed and timeframe chosen.

---

### 5. Save

Write to `plugins/<Name>/<version>/defaultContent/<camelCaseName>.dash.json`:

```json
{
  "name": "<Confirmed Title>",
  "schemaVersion": "1.5",
  "timeframe": "<chosen>",
  "variables": [],
  "dashboard": <normalized contents>
}
```

For a perspective dashboard, set `"variables"` to the variable template from scopes.json, e.g.:

```json
"variables": ["{{variables.[Algolia Index]}}"]
```

For a non-perspective dashboard, leave `"variables": []`.

See [source-example.json](references/source-example.json) and [migrated-example.json](references/migrated-example.json) for a before/after reference.

**Done when:** file written.

---

### 6. Update manifest

Ask where in `manifest.json` this dashboard should appear. Update `manifest.json` with the new entry at the specified position.

**Done when:** `manifest.json` updated and order confirmed.
