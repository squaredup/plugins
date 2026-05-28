---
name: migrate-plugin
description: Migrate an existing SquaredUp JavaScript (High-Code / HCP) plugin to a declarative low-code plugin (LCP). Use whenever the user wants to convert, port, rewrite, or move a JS-based plugin to low-code — even if they don't say "migrate" explicitly. Trigger phrases include "migrate plugin", "convert HCP", "convert this plugin to low-code", "port the JS plugin", "rewrite as low-code", "move the X plugin to low-code", "turn this handler.js into a low-code plugin", "low-code version of [plugin]".
metadata:
    author: SquaredUp
    version: "0.0.1"
---

# Migrating a SquaredUp High-Code Plugin to Low-Code

This skill guides the migration of an existing JavaScript-based SquaredUp plugin (an HCP — High-Code Plugin) into the declarative low-code plugin (LCP) format.

**Announce at start:** "I'm using the migrate-plugin skill."

> **Scope — Web API HCPs only.** Low-code plugins are built on the Web API connector. If the HCP talks to its source via PowerShell, ODBC, a database driver (MongoDB, MSSQL, MySQL, PostgreSQL), or a non-REST SDK (AWS SDK, Azure SDK), it cannot be expressed as a low-code plugin. Detect this in Phase 1 and stop with an explanation rather than producing a half-broken migration.

## Companion skill

The [`build-plugin`](../build-plugin/SKILL.md) skill is the authoritative reference for the **target LCP format** — file layout, `metadata.json` schema, data stream JSON shape, `indexDefinitions`, dashboard layout, the `squaredup` CLI, etc. This skill assumes you can read and apply `build-plugin` for any LCP detail. Don't re-derive LCP shape from scratch — open `build-plugin/SKILL.md` and copy patterns from it.

This skill focuses on the things `build-plugin` doesn't cover:
- Reading and inventorying the existing HCP
- Mapping HCP constructs to LCP constructs
- Deciding when the migration can't be completed declaratively

## When to use

- The user references an existing JS plugin (any file under `squaredup-plugin-repository/plugins/`) and wants it as a low-code plugin
- The user says "migrate", "convert", "port", "low-code version", or names a plugin by its repo folder and says they want it in this `plugins/` repo
- The user is staring at a `handler.js` or `handlerConfig.js` and asks you to "do this as low-code" or similar

If the user wants a **new** plugin (one that doesn't exist yet), use `build-plugin` instead.

---

## Required user inputs

Ask these via `AskUserQuestion` before they're needed — they cannot be inferred:

| Input | When to ask | Why |
| --- | --- | --- |
| **Path to the HCP** | Phase 1, if not already obvious from the conversation | The skill can't proceed without knowing which plugin to migrate. The repo is at `C:\Users\JamesDavenport\squaredup\squaredup-plugin-repository` by default. |

**Author:** Always set `author` to `{ "name": "SquaredUp Labs", "type": "labs" }` in the migrated `metadata.json`. Do not ask the user — this is the standard for migrated plugins regardless of who authored the HCP.

---

## Phases

Migration is interactive — **pause at the end of each phase and let the user confirm before continuing**. The user has chosen this pace deliberately: each phase produces files that subsequent phases depend on, and surfacing a bad mapping early is cheaper than discovering it five phases later.

Create a TodoList with these phases at the start:

- [ ] **Phase 1** — Locate and inventory the HCP; abort if non-Web-API
- [ ] **Phase 2** — Plan the migration (mapping doc)
- [ ] **Phase 3** — Migrate `metadata.json`
- [ ] **Phase 4** — Migrate `ui.json`
- [ ] **Phase 5** — Migrate import logic → `indexDefinitions/default.json` + import data streams
- [ ] **Phase 6** — Migrate `readDataSource` functions → per-stream `dataStreams/*.json`
- [ ] **Phase 7** — Migrate `custom_types.json` and any OOB content the HCP already has
- [ ] **Phase 8** — Validate with `squaredup validate --json` and fix errors

---

## Phase 1 — Locate and inventory the HCP

1. **Find the HCP folder.** If the user gave a path, use it. Otherwise ask. The folder will be of the form `…/squaredup-plugin-repository/plugins/{PluginName}/v{N}/`.
2. **Read the key files:**
   - `metadata.json` — note `name`, `version`, `type` (cloud/onprem/hybrid), `objectTypes`, `actions`, `keywords`, `links`, `category`.
   - `ui.json` — note every config field, validation, defaults, conditional visibility, encryption.
   - `data_streams.json` — note every `dataSource`, `dataStream`, `rowType`. This is the master list of what the plugin exposes.
   - `custom_types.json` — note icons and friendly names per type.
   - `handler.js` and (if present) `handlerConfig.js` — note which contract functions are implemented (`testConfig`, `importObjects`, `readDataSource`, `authBegin`, `authCodeResponse`) and where their logic lives.
   - `importObjects/*.js` — these become import data streams + `indexDefinitions/default.json`.
   - `readDataSource/*.js` — one file per data stream typically; these become per-stream JSON + optional post-request scripts.
   - `package.json` — note dependencies. Native HTTP clients (`axios`, `node-fetch`, `got`) are fine. Database drivers, AWS/Azure SDKs, PowerShell runners — see the non-Web-API check below.

3. **Check the HCP is Web API-shaped.** Look at `handler.js` / `handlerConfig.js` / the imports in the JS files. Stop and explain if you find any of:
   - `child_process` spawning `pwsh` / `powershell` (PowerShell plugins)
   - `mongodb`, `mssql`, `mysql2`, `pg`, `oracledb`, `odbc` (DB drivers)
   - `@aws-sdk/*` used for service calls (not just IAM signing helpers), `@azure/arm-*`, `@google-cloud/*` (cloud SDKs)
   - Anything that opens raw TCP / SSH / SMB sockets

   If the HCP is non-Web-API, **stop here**. Don't produce stub files. Explain to the user which non-REST mechanism the HCP uses and that LCP only supports HTTP/REST.

4. **Find the API.** The HCP code is the authoritative source for endpoints, paging, auth — read it carefully and extract:
   - The base URL (often constructed in code from `pluginConfig.serverUrl` + a path)
   - Auth pattern (header / bearer / OAuth / basic — match against `build-plugin` Phase 4 auth patterns)
   - Each endpoint actually called, with its HTTP method, query params, body
   - The paging strategy (look for loops over `nextToken`, page indices, link headers)
   - Any response transformation (look at what the function returns vs. what the API returns)

   Cross-reference with the external API docs the user provides or the docs link in `metadata.json` — code may be out of date or use a quirky pattern that the docs explain.

5. **Hand the inventory back to the user.** Summarise: plugin name, type, version, list of object types, list of data sources/streams, auth mechanism, paging pattern, anything you couldn't extract. Pause for confirmation before Phase 2.

---

## Phase 2 — Plan the migration

Before writing files, lay out the mapping. Share this plan with the user and pause.

For each HCP construct, identify its LCP equivalent:

| HCP | LCP |
|---|---|
| `metadata.json` `actions` block | Deleted entirely — LCP is configured by `base.plugin: "WebAPI"` + `base.config` |
| `metadata.json` `supportsConfigValidation: true` | Deleted — presence of `configValidation.json` is sufficient |
| `metadata.json` missing `schemaVersion` (or 1.x) | `"schemaVersion": "2.0"` |
| `metadata.json` `objectTypes: [...]` | Same string array, used as `sourceType` values |
| `handler.js` `testConfig` | `configValidation.json` referencing a lightweight import data stream (e.g. `/me`) |
| `importObjects/*.js` (or `handlerConfig.js` `importStages`) | One **import data stream** per object type + one `indexDefinitions/default.json` step per type |
| `readDataSource/*.js` switch case per data source | One **data stream JSON file** per case, using `baseDataSourceName` `httpRequestScoped` / `httpRequestScopedSingle` / `httpRequestUnscoped` |
| `data_streams.json` `dataStreams[i].template` | The stream's `ui` block (parameters) |
| `data_streams.json` `dataStreams[i].definition.metadata` | The stream's `metadata` block (columns) |
| `data_streams.json` `rowTypes` | Inlined into each stream's `metadata`; `rowTypes` doesn't exist in LCP |
| `data_streams.json` `matches` (top-level) | Lifted into each stream's own `matches` |
| `ui.json` field `title` attribute | **Drop** — not used in LCP |
| `ui.json` `text` field with `allowEncryption: true` | `password` field |
| `event.pluginConfig.X` references in code | `{{dataSource.X}}` for fields used in WebAPI base config, or `{{X}}` shorthand inside data stream `endpointPath` / `getArgs` |
| `event.targetNodes[i].propName` references | `{{object.propName}}` (scoped single) or `{{objects[0].propName}}` (scoped multi) |
| `event.timeframe.start` / `.end` / `.intervalMs` | `{{timeframe.start}}` / `{{timeframe.end}}` (ISO 8601), `{{timeframe.unixStart}}` / `{{timeframe.unixEnd}}` (epoch seconds), `{{timeframe.interval}}` (ISO duration) |
| `event.dataSourceConfig.X` references | `{{X}}` — the stream's own `ui` parameter value |
| JS transformation logic that flattens / filters / joins | A `postRequestScript` referenced by file name in the stream config |
| JS logic that maps status strings to states | A `state`-shape `map` in the column metadata (declarative — preferred) |
| JS logic that picks a sub-path from the response | `pathToData` in the stream config (declarative — preferred over a script) |
| JS logic that renames columns | `displayName` in metadata (declarative — preferred over a script) |
| Computed column derived from another column | A `computed: true` column with `valueExpression` (declarative — preferred over a script) |
| OAuth handlers (`authBegin` / `authCodeResponse`) | `authMode: "oauth2"` + `oauth2GrantType: "authCode"` in `base.config` — token refresh is automatic |
| `context.patchConfig('hiddenToken', …)` token caching | **Deleted** — LCP OAuth handles token refresh automatically |

**Declarative-first rule** (the user has chosen this): when an HCP `readDataSource` function does work that could be expressed as `pathToData`, a `state` map, a `valueExpression`, or `displayName` rename, **always prefer the declarative LCP form** rather than transplanting the JS into a `postRequestScript`. Reach for a script only when the transformation is genuinely structural (flatten nested arrays, dedup, join across response sections, derive values not present in the response).

**Output the mapping doc to the user.** A markdown table of each HCP file/construct → planned LCP destination. The user should be able to sanity-check it in a minute.

**Things to call out in the mapping:**
- Any data source the HCP exposes that doesn't have an obvious endpoint mapping
- Any logic in the JS that's doing non-trivial work (rate limiting, retries, multi-request joins) — these will need careful migration or may not have a direct LCP equivalent
- Anything that looks suspicious (deprecated streams, dead code, commented-out endpoints)

Pause for confirmation.

---

## Phase 3 — Migrate `metadata.json`

Target path: `C:\Users\JamesDavenport\squaredup\plugins\plugins\{PluginName}\v{N}\metadata.json` — in the **low-code plugins repo**, not the HCP repo.

**Folder naming:** The LCP plugin folder uses PascalCase matching the HCP (e.g. `IsDown`, `OctopusEnergy`). The `name` field inside `metadata.json` uses **lowercase kebab-case** (e.g. `is-down`, `octopus-energy`) — this differs from the HCP convention where `name` is often PascalCase. See `build-plugin` Phase 4 for the conventions.

**Version bump:** The user has chosen to **match the HCP's current major** — if the HCP is at `2.4.1`, the LCP starts at `2.5.0` (next minor in the same major). This treats migration as an in-place upgrade; existing tenant configs continue to work.

> If the HCP's data streams are about to change shape in a way that would break existing dashboards (e.g. a column gets renamed, an objectType changes), surface that to the user — they may want a new major version (`3.0.0`) instead.

**Construct the `base` block** from the auth pattern identified in Phase 1. See `build-plugin` Phase 4 for the exact shape per auth mode (header / bearer / basic / oauth2 / etc.).

**Drop:**
- `actions` block (entirely)
- `supportsConfigValidation` (file presence is enough)
- `screenshots` (not used in LCP)

**Keep:**
- `name`, `displayName`, `description`, `category`, `keywords`, `objectTypes`, `links`
- `type` — `cloud` / `onprem` / `hybrid`; if the HCP was `cloud` and the API is reachable from the public internet, `hybrid` is usually fine for the LCP

**Replace:**
- `author` → `{ "name": "SquaredUp Labs", "type": "labs" }` regardless of the HCP's original author

**Add:**
- `schemaVersion: "2.0"`
- `importNotSupported`: only if the HCP genuinely has no import logic
- `restrictedToPlatforms` if absent (usually `[]`)

**`links.category`:** make sure each link has a `category` (`documentation`, `marketing`, `source`). HCP links sometimes omit it.

Show the diff (or final file) to the user and pause.

---

## Phase 4 — Migrate `ui.json`

Target: `…\v{N}\ui.json` in the LCP repo.

Walk each field in the HCP `ui.json` and convert:

- Drop the `title` attribute everywhere — it's deprecated in LCP and the validator will flag it.
- Convert `text` + `allowEncryption: true` → `password`.
- Convert `text` + `validation.format: "url"` → `url`.
- `autocomplete` fields with `data.source: "fixed"` carry over unchanged.
- `autocomplete` fields with `data.source: "fromDataSource"` need to be converted to `data.source: "dataStream"` and pointed at the migrated import stream — make sure that stream returns `label` and `value` columns with `role: "label"` / `role: "value"`. See `build-plugin` Phase 5.
- `fieldGroup` with `visible` carries over; field types like `radio`, `checkbox`, `key-value`, `oAuth2` are 1:1.
- For OAuth plugins, add `{ "type": "oAuth2", "name": "oauth2", "label": "Sign in" }` if the HCP used OAuth but didn't have the field declared (HCPs often handle OAuth via the `authBegin` flow without a UI button).

Show the file and pause.

---

## Phase 5 — Migrate import logic → `indexDefinitions/default.json` + import data streams

For each `importObjects/*.js` file (or each entry in `handlerConfig.js` `importStages`), produce **one import data stream** plus **one step in `indexDefinitions/default.json`**.

### The import data stream

This is a regular data stream whose job is to return one flat row per object. Place it in `dataStreams/{streamName}.json`. Typical shape — see `build-plugin` Phase 5 for full detail:

```json
{
    "name": "installations",
    "displayName": "Installations",
    "description": "Imports installations from the API",
    "tags": ["Import"],
    "baseDataSourceName": "httpRequestUnscoped",
    "config": {
        "httpMethod": "get",
        "endpointPath": "installations",
        "paging": { /* derive from the HCP's paging code */ },
        "postRequestScript": "installations.js"
    },
    "matches": "none",
    "metadata": [{ "pattern": ".*" }],
    "timeframes": false
}
```

### The post-request script

Only use the post-request script when absolutely necessary. Prefer using object mappings only. If you must use post-request scripts, inform the user in the step summary, and explain why.

The HCP's `addVertexForApp` (or equivalent) becomes a `dataStreams/scripts/{streamName}.js` script. Transcribe the logic but adapt to the LCP script contract:

> ⚠️ **Don't combine `pathToData` with a `postRequestScript` in the same stream.** When a script is present, the script's `data` is the **full response body** — `pathToData` does not pre-extract the array. Either use `pathToData` alone (with declarative metadata) or use a script alone and navigate the response inside the script (e.g. `const items = data?.orgs ?? [];`). Combining them looks correct but fails at runtime with `(data ?? []).map is not a function` because the script receives the wrapper object rather than the array.

| HCP | LCP script |
|---|---|
| `for (const app of response.data.apps) { context.vertices.push({sourceId, sourceType, name, …}) }` | `result = (data?.apps ?? []).map(app => ({ sourceId, sourceType, name, … }))` |
| `context.pluginConfig.X` | `context.config.X` (only the stream's own params — top-level config is not available) — usually you don't need it in an import script |
| `context.log.debug(…)` | Remove — not available in scripts |
| `context.report.warning(…)` | Remove — not available in scripts |

Globals available: `data`, `context` (with `objects`, `timeframe`, `config`), and lodash as `_`. See `build-plugin` Phase 8.

### `indexDefinitions/default.json`

One step per import stream. The `objectMapping` block tells the platform which column holds the sourceId, name, type, and which extra properties to retain. See `build-plugin` Phase 6.

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
                "properties": ["installationId", "timezone"]
            }
        }
    ]
}
```

> The stored `sourceId` is prefixed with `sourceType~` automatically. If the original ID needs to be used in a downstream endpoint path, store it as a separate property and reference `{{object.installationId}}` rather than slicing the prefixed sourceId. This was a no-op in the HCP because `event.targetNodes[i].sourceId` was the raw ID — it's a behaviour change in LCP.

Show the user the files and pause.

---

## Phase 6 — Migrate `readDataSource` functions → per-stream JSON files

For each `case` in `handler.js`'s `readDataSource` switch (or each entry in `handlerConfig.js`'s `dataSourceFns`), produce **one data stream JSON file** under `dataStreams/`.

### Pick the right `baseDataSourceName`

This is the most consequential decision per stream. Match against the HCP code:

- If the function loops over `event.targetNodes` and makes one API call per target → `httpRequestScopedSingle`
- If the function takes `event.targetNodes` and passes them as a single combined argument (e.g. comma-separated, multi-value query param) → `httpRequestScoped`
- If the function ignores `event.targetNodes` entirely → `httpRequestUnscoped` (and `matches: "none"`)

### Translate the URL construction

The HCP probably builds the URL like:

```js
const url = `${pluginConfig.serverUrl}/devices/${targetNode.sourceId}/metrics?start=${event.timeframe.unixStart}`;
```

becomes:

```json
"endpointPath": "devices/{{object.deviceId}}/metrics",
"getArgs": [
    { "key": "start", "value": "{{timeframe.unixStart}}" }
]
```

The `baseUrl` itself lives in `metadata.json` `base.config.baseUrl`, not in each stream.

> **Sourcing IDs:** Don't use `{{object.sourceId}}` if the HCP code was using the raw ID — LCP prefixes sourceIds with `sourceType~`. Add the raw ID as a property in the import step (Phase 5) and reference `{{object.deviceId}}` instead.

### Translate headers and body

If the HCP code adds per-request headers beyond auth, they go in the stream's `config.headers`. POST bodies go in `config.postBody` (string or object). See `build-plugin` Phase 7 for the shapes.

### Translate paging

The HCP often loops with explicit page handling — extract the pattern (next-token, next-URL, offset/limit) and configure the LCP `paging` block to match. See `build-plugin` Phase 7 `paging`.

### Translate response transformation

Walk through the JS function from the response back to the returned row array:

1. If it just picks a sub-path (`response.data.items.map(item => …)`), set `pathToData: "data.items"` and **skip the script**.
2. If it renames fields (`row.deviceName = item.name`), use `displayName` in `metadata` instead of a script.
3. If it maps a status field to a state, use `shape: ["state", { "map": {…} }]` in `metadata`.
4. If it derives a column from another column (`row.url = ${baseUrl}/devices/${item.id}`), use a `computed: true` column with `valueExpression`.
5. **Only if none of the above fit**, write a `postRequestScript` — and write only the transformation, dropping the URL construction, paging loop, and auth header building (which now happen in the LCP base config).

### Translate `timeframes`

- HCP `definition.timeframes: false` → LCP `timeframes: false`
- HCP supports timeframes → LCP `timeframes: true` (or restrict to a subset of names)
- The HCP convention "this stream doesn't take a timeframe but its name ends with (Anytime)" is **not used in LCP** — just set `timeframes: false`.

### Translate `template` (stream parameters)

HCP `data_streams.json` `dataStreams[i].template` becomes the stream's top-level `ui` block. Same field shapes as `ui.json` (text, autocomplete, etc.). Drop `title` attributes.

### Translate `matches`

HCP `data_streams.json` has a top-level `matches` and each stream may override. In LCP each stream has its own `matches`. Lift the constraints — most often `{ "sourceType": { "type": "oneOf", "values": ["..."] } }`. See `build-plugin` Phase 7.

### Post-Request Scripts
Only use the post-request script when absolutely necessary. Prefer using object mappings only. If you must use post-request scripts, inform the user in the step summary, and explain why.
### Migration discipline

Each stream gets done one at a time. Don't batch all of them in one pass — it's easy to mis-map paging on stream 3 and propagate the same bug across all 12. Walk one stream end-to-end, show the user, then move on.

When all streams are done, pause for review.

---

## Phase 7 — `custom_types.json` and OOB content

### `custom_types.json`

Mostly carries over. Check each entry:
- `sourceType` must match an entry in `metadata.json` `objectTypes` (same string).
- `icon` should be a FontAwesome name in lowercase kebab-case. HCPs sometimes use older icon set names — verify against `fontawesome.com/icons` and swap if needed.
- Add `singular` / `plural` if missing — the LCP UI uses them.

### OOB content

**The user has chosen to migrate only what already exists in the HCP — don't generate new OOB dashboards.** If the HCP has none, skip this phase entirely. If it has Confluence-defined dashboards, JIRA-attached dashboards, or anything in a `defaultContent/` folder, port those — see `build-plugin` Phase 9 for the dashboard format.

If you spot that the HCP has zero OOB content, mention it to the user as something they may want to add later (with `build-plugin`).

### `docs/README.md`

This is **required** in LCP (`build-plugin` Phase 3). Check the HCP for any existing setup notes (`README.md`, `pluginsetup-*.md`, the `links[].url` `documentation` target). Use whatever exists; otherwise write a minimal README covering:
1. What the plugin monitors
2. How to get credentials
3. The fields in `ui.json`
4. The imported object types
5. Known limitations

Don't fabricate setup steps — if you don't know how to get credentials for the target service, ask the user or note it as TODO.

Pause for review.

---

## Phase 8 — Validate and fix

Run `squaredup validate --json` from the LCP directory (`…\plugins\{PluginName}\v{N}\`) and parse the output. Repeat until clean:

```bash
squaredup validate --json
```

Common errors and their fixes:

| Error | Fix |
|---|---|
| Field `title` is not allowed | Drop the `title` attribute (Phase 4 catches most; check stream `ui` blocks too) |
| `sourceType` does not match any `objectTypes` | Make sure the import step's `type` column produces a value that's literally in `metadata.json` `objectTypes` |
| Stream references unknown `pathToData` | The HCP returned the array directly; remove `pathToData` and either rely on `result =` in the script or use a top-level `pathToData` |
| `metadata` column shape inference disagrees with declared shape | Either drop the declared `shape` (let inference run) or coerce the script's output to the right JS primitive |
| `paging` `in.path` doesn't match the response | The HCP code may handle paging in a way the LCP `paging` block can't express — fall back to a `postRequestScript` that does the paging loop, or document the limitation |

Once validation is clean, **don't** auto-deploy. Hand off to the user with a summary of:
- Files written
- Anything skipped (e.g. OOB dashboards because the HCP had none)
- Anything stubbed (e.g. a script that needs human review)
- The exact `squaredup deploy` command they can run when ready

---

## Things that don't translate cleanly

Flag these to the user when you spot them. Don't try to silently approximate.

1. **`context.patchConfig` token caching.** Native LCP OAuth handles token refresh automatically — the HCP's caching logic just gets dropped. Sanity-check that the user understands their custom token flow is being replaced by the platform default.
2. **Custom retry / backoff logic.** LCP doesn't expose request retry config; rate-limit handling is platform-level. If the HCP had specific retry semantics, note that they're not preserved.
3. **Multi-request joins** (e.g. fetch list of A, then for each A fetch B and merge). LCP doesn't compose requests within a stream. The usual approach is to use the API's bulk endpoint if one exists, or split into two streams the user combines in a dashboard.
4. **Logging via `context.log.*` and `context.report.*`.** These don't exist in LCP scripts. Drop them; user-facing errors go through `errorHandling` config or stream descriptions.
5. **`testConfig` doing complex multi-step checks.** Translate each meaningful check into a separate `configValidation.json` step pointing at a lightweight stream — `build-plugin` "Config validation" pattern. If a check can't be expressed as a stream, document the limitation.
6. **`importObjects` returning edges.** LCP's `objectMapping` doesn't directly create edges — relationships are inferred from properties that match other objects' sourceIds. If the HCP relies on explicit edges (`{ outV, inV, label }`), surface this — the user may need to restructure properties to enable the implicit linkage.
7. **Non-deterministic ID generation in HCP** (e.g. `crypto.randomUUID()` to fake stable IDs). LCP needs stable IDs from the source — flag this; the user may need to choose a different field.

---

## Quick-reference: HCP file → LCP destination

```
HCP/v{N}/                                LCP/v{N}/
  metadata.json                            metadata.json                          (rewritten)
  ui.json                                  ui.json                                (cleaned)
  custom_types.json                        custom_types.json                      (mostly preserved)
  data_streams.json                        dataStreams/{streamName}.json (×N)     (one per dataStream)
  handler.js                                                                       (deleted)
  handlerConfig.js                                                                 (deleted)
  importObjects/*.js                       dataStreams/{importStream}.json +      (one per file)
                                           dataStreams/scripts/{importStream}.js +
                                           indexDefinitions/default.json          (one step per file)
  readDataSource/*.js                      dataStreams/{streamName}.json +        (one per file)
                                           dataStreams/scripts/{streamName}.js    (only if logic survives)
  util/*.js                                                                        (deleted — replaced by declarative config)
  package.json                                                                     (deleted — no Node runtime)
  cspell.json                                                                      (deleted)
  jira.json                                                                        (deleted)
  (no equivalent)                          docs/README.md                         (required, write it)
  (no equivalent)                          configValidation.json                  (from testConfig)
  (no equivalent)                          icon.svg                               (find brand logo per build-plugin Phase 3)
```

---

## Style and tone

The migrated LCP should read as if it was authored from scratch. Don't leave comments like `// migrated from handler.js` or `// was previously addVertexForApp` — they don't belong in the LCP and will rot. The git history is the record of the migration.

Don't preserve dead code, commented-out blocks, or stale TODOs from the HCP. If the HCP has them, they're being abandoned with the JS — this is the cleanup opportunity.
