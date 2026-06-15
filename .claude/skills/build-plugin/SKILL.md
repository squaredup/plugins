---
name: build-plugin
description: Guides building a SquaredUp low-code plugin for HTTP/REST APIs, from API exploration through deployment. Use when the user wants to integrate a service with SquaredUp, add a new data source, connect to a third-party tool, "pull data from", or "monitor" any service in SquaredUp.
metadata:
    author: SquaredUp
    version: "0.0.9"
---

# Building a SquaredUp Low-Code Plugin

> **Scope:** Web API-based plugins only. If the target tool has no usable REST API, PowerShell may be a better fit — suggest it and stop.

**Announce at start:** "I'm using the build-plugin skill."

> **The `references/` files are canonical — don't browse other plugins for patterns.** Everything you need to author a plugin (structure, config, streams, dashboards) is in `references/`. Do **not** open *other* plugins in the repo to copy how they did something: it burns context, and shipped plugins frequently predate current guidance, so they teach the wrong pattern (see e.g. the script caveat in [data-streams.md](references/data-streams.md)). Reading the plugin you're **currently building or updating** is expected; browsing siblings for "how did they do it" is not.

---

## Prerequisites

This skill **tests every data stream against a live, authenticated plugin** in your tenant before relying on it — testing is not optional. That requires the `squaredup` CLI logged in and a tenant you can authenticate the plugin in. Confirm both **before Phase 1**:

1. Run `squaredup status`. If it reports you are not logged in, ask the user to run `! squaredup login` in this session (interactive; regions: `us`, `eu`, `dev`), then re-check. Login/region mechanics live in the `deploy-plugin` skill.
2. Confirm the user has a SquaredUp tenant where they can add and authenticate the plugin.

Checkpoint B drives the import with `squaredup index` / `index-status`, so a current `squaredup` CLI is assumed.

If login or a tenant is unavailable, **stop** — this skill cannot build a plugin it cannot test.

---

## Required user inputs

| Input                                             | When to ask                              | Why                                                                                    |
| ------------------------------------------------- | ---------------------------------------- | -------------------------------------------------------------------------------------- |
| **Author handle** (GitHub handle or display name) | Before writing `metadata.json` (Phase 4) | Goes into `author.name`. Guessing from git config frequently picks the wrong identity. |

If the user has already volunteered the answer earlier in the conversation or you're updating a plugin, use that and skip the prompt. Otherwise, ask — even in autonomous mode.

---

## When to Use

- Building a new plugin for an HTTP/REST API
- Adding data streams or dashboards to an existing plugin
- Any request to integrate a service, "pull data from", or "monitor" a service in SquaredUp
- Adding a new data source or integration to a SquaredUp workspace

---

## Checklist

Create a TaskCreate task for each phase. The flow deploys early and tests as it builds, so deploy/authenticate/test checkpoints are interleaved between the writing phases:

- [ ] **Prerequisite** — `squaredup status`; ensure login + tenant (see [Prerequisites](#prerequisites))
- [ ] **Phase 1** — Explore the API
- [ ] **Phase 2** — Plan the plugin structure
- [ ] **Phase 3** — Scaffold files (icon, file structure, `docs/README.md`)
- [ ] **Phase 4** — Write `metadata.json`, `ui.json`, `configValidation.json` + its backing stream — the deployable **shell** → [metadata.md](references/metadata.md), [ui.md](references/ui.md)
- [ ] **Checkpoint A** — Deploy the shell and authenticate (invoke `deploy-plugin`, probe auth) → [checkpoints.md](references/checkpoints.md)
- [ ] **Phase 5** — Write import definitions and import streams; test each in parallel sub-agents → [index-defs.md](references/index-defs.md), [test-agent.md](references/test-agent.md)
- [ ] **Checkpoint B** — Redeploy, then trigger + await the import via the CLI so objects exist → [checkpoints.md](references/checkpoints.md)
- [ ] **Phase 6** — Build + test data streams in parallel sub-agents → [test-agent.md](references/test-agent.md), [data-streams.md](references/data-streams.md)
- [ ] **Phase 7** — Build OOB default content in a sub-agent (it reads [oob-content.md](references/oob-content.md))
- [ ] **Phase 8** — Write `custom_types.json` → [common-patterns.md](references/common-patterns.md)
- [ ] **Phase 9** — Final validate and deploy → invoke the `deploy-plugin` skill; re-index if import definitions changed since the last import

---

## Phase 1: Explore the API

Before writing a single file, understand the API. **Use `AskUserQuestion` to ask for API documentation URLs, OpenAPI/Swagger specs, Postman collections, or any other reference material.** You can also search online, but verify you're looking at docs for the exact product/version the user wants.

1. **Find the docs** — Gather URLs or spec files from the user, then fetch and read them.
2. **Identify the object model** — What are the core entities? (e.g. installations, devices, sites). These become the **indexed objects** in SquaredUp — available for drilldown, search, scoping dashboards, and use as variables.
3. **Find the list endpoints** — Used to import objects. Prefer fetching **50–250 records per page** across multiple requests — SquaredUp has a per-page timeout but supports as many paged requests as needed.
4. **Find the data endpoints** — These power data streams. For each, record:
    - **Scoping** — scoped to a single object, multiple objects, or global (no object context).
    - **Time-range control** — does the endpoint accept a queryable time range at all (a `from`/`to`, `start`/`end`, or `period` parameter)? If it returns a fixed snapshot / current values with no way to ask for a range, the stream's `timeframes` will be `false` (the user can't pick a range).
    - **Data granularity** — when the endpoint *does* accept a range, the finest interval it aggregates at: **per-event/raw**, **hourly**, **daily**, or **monthly**. Read this off the API docs (aggregation windows, `granularity`/`interval` params, the minimum queryable range). Granularity drives the stream's `timeframes` array in Phase 2 — an endpoint aggregated to daily (e.g. billing) returns nothing for the default `last1hour` timeframe, so capturing it here prevents first-test 404s in Phase 6.
5. **Understand pagination** — Cursor/next-token, or offset/limit? Separate concern from response transformation.
6. **Note the auth pattern** — API key in header, Bearer token, OAuth2, Basic auth? Determine from the docs.

---

## Phase 2: Plan the Plugin Structure

This phase produces a written plan and a user-approval gate before any files are written. Object types, import shape, and sourceId format are expensive to change once Phase 3+ commits them to JSON — Phase 2 is where scope errors are cheap to fix.

### The plan must cover

1. **Object types** — Every type that should appear in the SquaredUp graph. These go in `objectTypes` in `metadata.json` and as `sourceType` throughout.
2. **Import steps** — Let the API shape dictate: one step returning many types, or separate steps per type.
3. **Data streams** — For each object type, plan:
    - A **summary/current state** stream (`"timeframes": false`, returns current values)
    - A **history/metrics** stream (supports timeframes, returns time-series rows)
    - Any **cross-object** streams scoped to a parent (e.g. alarms for an installation)
    - **Prefer configurable streams** over hardcoded ones — use a UI parameter rather than multiple streams for the same endpoint with different values.
    - **Supported timeframes** — state each stream's `timeframes` value, derived from the endpoint's **time-range control** and **data granularity** recorded in Phase 1:
        - `false` when the endpoint exposes no time-range parameter — the user can't choose a range (returns a fixed snapshot or current values regardless).
        - An **array** when the endpoint accepts a range but aggregates coarsely: don't leave the default `true`, because a daily-granularity endpoint can't serve `last1hour`. Restrict `timeframes` to the smallest window the granularity supports and up (e.g. daily → `last7days`+).
        - `true` when the endpoint accepts a range at fine granularity and any timeframe works.
4. **What's intentionally omitted** — API capabilities not being implemented, and why. Highest-value section for catching scope creep.
5. **Authentication** — Auth mechanism and any UX concerns (token expiry, rate limits, hard-to-obtain credentials).
6. **OOB dashboards** — A **top-level summary dashboard** plus **one perspective per object type** scoped via a dashboard variable.
7. **sourceId format** — Use the raw API ID wherever possible.

### Plan format

Post the plan as markdown with one `###` heading per item above. Short example:

```markdown
## Plan

### Object types

- `My Installation` — sites being monitored
- `My Device` — physical devices reporting telemetry

### Import steps

- `installations` — one step, returns both types

### Data streams

| Stream | Scope | Time range? / granularity | `timeframes` |
| --- | --- | --- | --- |
| `batterySummary` | per-device, current state | no range param — current snapshot | `false` |
| `batteryHistory` | per-device, time-series | range, hourly granularity | `true` |
| `siteAlarms` | per-installation | no range param — current alarms | `false` |
| `siteBilling` | per-installation | range, daily granularity | `last7days`+ (default `last1hour` 404s) |

### What's intentionally omitted

- Webhook ingestion (no v1 use case)

### Authentication

- API key in `X-API-Key` header

### OOB dashboards

- Overview, Installation perspective, Device perspective

### sourceId format

- Installation: raw API `id`
- Device: composite `{installationId}-{deviceId}` (API has no global device ID)
```

### Approval gate

**When to fire:** when `metadata.json` doesn't exist yet in the plugin folder, OR when the planned `objectTypes` differs from the current `metadata.json`. Otherwise skip — incremental work that doesn't introduce new entities doesn't need the gate.

**How:** post the plan, then call `AskUserQuestion` **in the same turn** with three options:

- `Approve as written` → proceed to Phase 3
- `Trim scope — start with less` → user wants a smaller MVP; ask what to cut
- `Adjust — different objects/streams/auth` → user wants changes; ask what specifically

If the user picks anything other than approve (including "Other"), revise the plan and re-fire the gate with the updated plan. Loop until approval — a revised plan can introduce new wrong assumptions, so the second pass is doing real work, not theatre. If the user explicitly waives further gating ("just proceed", "looks fine, go", "stop asking"), honor that for the rest of this conversation.

---

## Phase 3: Scaffold Files

**Icon — delegate to a write-capable sub-agent.** Finding the official logo means browsing vendor sites and image search, and the SVG/PNG markup itself is large — all of which floods the main context if done inline. Spawn **one general-purpose, write-capable sub-agent** for the icon (**not** an `Explore` agent — those are read-only and can't write the file). Give it this prompt:

- **Find** the official brand/product logo (SVG preferred, PNG acceptable). Never auto-generate a generic icon.
- **Post-process the SVG if needed** — SquaredUp shows icons on dark/white backgrounds. Fix if the SVG lacks a background or is not square:
    1. Set `width="512" height="512" viewBox="0 0 512 512"`
    2. Insert `<rect width="512" height="512" fill="BRAND_COLOR"/>` as the first child
    3. Wrap paths in `<g transform="translate(X, Y) scale(S)">` for ~10% padding: `S = min(409.6/w, 409.6/h)`, `X = (512−w*S)/2`, `Y = (512−h*S)/2`
- **Write** the finished icon to `<plugin>/v1/icon.svg`.
- **Return only** the file path, the source URL the logo came from, and a one-line licence/attribution note. **Never return the SVG or PNG markup itself** — the file on disk is all that's needed, and the markup is pure context bloat.

If the sub-agent reports it couldn't find an official logo, ask the user to supply one.

**File structure:**

```
my-plugin/
  v1/
    metadata.json
    ui.json
    icon.svg
    custom_types.json
    configValidation.json      # required for authenticated APIs; validates config on setup
    docs/
      README.md                # REQUIRED: shown in-product when users add the plugin
    indexDefinitions/
      default.json
    dataStreams/
      myStream.json
      scripts/
        myScript.js
    defaultContent/
      manifest.json
      scopes.json
      overviewDashboard.dash.json
      deviceDashboard.dash.json  # single perspective — no sub-folder needed
      Installations/             # sub-folder only for multiple dashboards of the same type
        manifest.json
        dashboard1.dash.json
```

**docs/README.md (required)** — surfaced in-product when a user adds the plugin. Always create as part of scaffolding; the `documentation` link in `metadata.json` must point to it (e.g. `https://github.com/squaredup/plugins/blob/main/plugins/MyPlugin/v1/docs/README.md`).

The README must cover:

1. What the plugin monitors — objects imported, what dashboards show
2. Prerequisites / getting credentials — step-by-step, include required scopes/permissions
3. Configuration fields — table explaining every `ui.json` field: what it is, where to find the value, whether required
4. What gets indexed — list object types and what they represent
5. Known limitations — rate limits, permission requirements, API quirks

Write as if the user has never seen the API. They're reading it inside SquaredUp, not on the vendor's site.

**Other rules:**

- `scopes.json`: only include scopes used by OOB dashboards. Don't add speculatively.
- `configValidation.json`: **required for authenticated APIs**, recommended otherwise. Its lightweight backing stream doubles as the auth probe in Checkpoint A — see [common-patterns.md](references/common-patterns.md).
- **Single-dashboard rule:** Only create a sub-folder under `defaultContent/` when you have **multiple dashboards** for the same type.

---

## Phase 4: Plugin identity, auth & config validation (the shell)

Write `metadata.json`, `ui.json`, and — for any authenticated API — `configValidation.json` plus its backing data stream. Read [metadata.md](references/metadata.md) and [ui.md](references/ui.md); for the validation step pattern read [common-patterns.md](references/common-patterns.md).

This is the deployable **shell**: just enough to deploy, add to a tenant, and authenticate. The configValidation backing stream is a single **unscoped** call to a lightweight endpoint (e.g. `/me`) — it both validates the user's config on setup and serves as the auth probe in Checkpoint A. Don't write data streams or import definitions yet.

---

## Checkpoint A: Deploy the shell & authenticate

The shell can't be tested until it's deployed and a config is authenticated against it.

1. **Deploy** — invoke the `deploy-plugin` skill to validate and deploy the shell. Deploy with `squaredup deploy --json --force`; the JSON output includes the deployed `pluginId` — **capture it here** rather than looking it up later.
2. **Authenticate** — give the user a direct link to the plugin's setup page so they can add it to their tenant and authenticate:
    - Plugin id: take the `pluginId` from the `deploy --json` output in step 1. (No need to run `squaredup list` — the deploy already returned it.)
    - Region: `squaredup status` prints `Region: <region>`. Build the host — `us` → `app.squaredup.com`, `dev` → `master.dev.app.squaredup.com` any other region → `<region>.app.squaredup.com` (e.g. `eu` → `eu.app.squaredup.com`).
    - Send them to `https://<host>/settings/plugins?addPluginId=<id>` and ask them to authenticate it. **Pause and wait for them to confirm.**
3. **Capture the datasource id** — you already have the `pluginId` from step 1. The datasource only exists once the user authenticates, so run `squaredup datasources --json` now to grab the datasource `id`. Reuse both as `--plugin-id <id> --datasource-id <id>` on every `test`/`objects` call from here on (Phases 5–6, Checkpoint B) so the CLI skips the plugin and datasource lookups each call. **Pass both ids into every testing sub-agent prompt** spawned in Phases 5 and 6 (see [test-agent.md](references/test-agent.md)).
4. **Probe** — run `squaredup test <validationStream> --plugin-id <pluginId> --datasource-id <id> --diagnostic Status --json --silent` and confirm the returned `Status` is a 2xx. `--diagnostic Status` filters the response to just the HTTP-status diagnostic (a one-line JSON array), so the probe never dumps the full `currentUser` diagnostics into the main context. A non-2xx status — or a request error (printed to stderr, exit code 1) or a missing `Status` diagnostic — means auth isn't right yet; **only then** drop `--diagnostic Status` to inspect the full response. Repeat until the status is 2xx.

Do not proceed to Phase 5 until auth is confirmed. See [checkpoints.md](references/checkpoints.md) — the main agent never reads [testing.md](references/testing.md); that is the sub-agents' per-stream testing guide.

---

## Phase 5: Import definitions & import streams

Write `indexDefinitions/default.json` and the unscoped list/import streams it calls — these are coupled (the index steps reference the stream columns), so author them here in the main agent. Read [index-defs.md](references/index-defs.md) — it is **self-contained** for import-stream authoring (script checklist, paging modes, wiring). Do **not** read [data-streams.md](references/data-streams.md) for this or any later phase: it is the large Phase 6 authoring guide and only the testing sub-agents read it.

Then **test the import streams in parallel sub-agents** rather than inline — the raw paged response bodies are large and the streams are independent. Spawn **one test-mode sub-agent per import stream, all in a single message**, passing the `--plugin-id <id> --datasource-id <id>` captured at Checkpoint A. Each sub-agent tests its (already-written) unscoped stream, confirms it returns one flat row per object, and returns a compact report (per [test-agent.md](references/test-agent.md)). Fix any stream a sub-agent flags before Checkpoint B.

### Reconciliation pass (before proceeding)

Sub-agents run blind to each other, so several can independently rediscover — or contradict each other on — the same API fact. After collecting **all** reports, before moving to Checkpoint B, reconcile them rather than just resolving each report in isolation:

1. **Diff the reports** against each other — line up every report's **"API-level discoveries"** section plus its fixes applied, assumptions, and constraints hit. Look for the same fact appearing in one report but missing from its siblings.
2. **Propagate every API-level discovery to all sibling streams** that share the endpoint family or scoping — timeframe/granularity limits, payload caps, object property/id names, auth quirks. A constraint one sub-agent hit and fixed almost always applies to its siblings too; apply the same edit to each affected stream and **re-test every stream you changed** (re-spawn a test-mode sub-agent for it — a propagated edit is unproven until tested).
3. **Resolve conflicting assumptions** before continuing — if two reports name the same object property or id differently (e.g. one filters on `projectId`, another on `rawId`), determine the correct one against the real response and fix every stream that used the wrong one. Do not proceed with an unresolved contradiction.

If reconciliation edits an `indexDefinitions/*.json` mapping or an import stream, that edit only changes what a **future** import produces — see the re-indexing rule under [Checkpoint B](#re-indexing-rule--a-post-import-definition-change-invalidates-the-imported-objects). Here in Phase 5 the import hasn't run yet, so the edit will be picked up by the Checkpoint B import naturally; no extra re-index is needed.

---

## Checkpoint B: Redeploy & run the first import

Scoped data streams can't be tested until objects exist, which means the import steps must be live and an import must have run. The CLI triggers and tracks the import for you, so **drive it yourself — don't ask the user to run it in the UI.**

1. **Redeploy** — invoke `deploy-plugin` again so the new import steps ship. The import definitions only take effect once this redeploy lands, so the import must run _after_ it.
2. **Trigger** — `squaredup index --datasource-id <id> --no-wait --json`. `--no-wait` returns immediately with a `since` anchor (capture it) instead of blocking until the import finishes — you poll for completion in the next step. (Plain `squaredup index` now waits and prints progress itself, which can outlast an agent command timeout on a long import; `--no-wait` is the orchestration path.) If an import was already running it reports `alreadyRunning: true` and adopts that run — poll with the `since` it returns either way.
3. **Wait** — poll `squaredup index-status --datasource-id <id> --since <since> --json` until `done` is `true`, passing the `since` from step 2. `succeeded: true` means objects are indexed; `succeeded: false` means the import failed — read the run-level `message` and the per-step `steps[]` (which step has `status: "failed"` and its `errorReason`) to pinpoint the break, fix that import stream, and re-trigger before continuing. Imports can take several minutes; use a generous timeout. See [checkpoints.md](references/checkpoints.md).
4. **Confirm** — check objects landed with an **inline scope**: `squaredup objects --matches '{"sourceType":{"type":"equals","value":"<Object Type>"}}' --plugin-id <pluginId> --datasource-id <id> --json` should return a non-empty list. `<Object Type>` is a `sourceType` from the `objectTypes` you defined in `metadata.json` / `indexDefinitions/default.json`. Use `--matches` here, **not** `objects <stream>`: that form resolves a data stream file's `matches`, but no scoped data stream exists yet (those come in Phase 6) and the import streams written so far have no `matches` to resolve. For the same reason, pass **inline** JSON — `--matches @<importStream>.json` won't work, as an import stream's `matches` is `none`/absent.

### ⚠️ Re-indexing rule — a post-import definition change invalidates the imported objects

The objects now in the graph were imported under the **current** `indexDefinitions/*.json` and import streams. **Any edit to `indexDefinitions/*.json` or an import stream after this import has run does not reach the existing objects** — they keep the shape they were imported with. A new mapped property you add now is absent on every already-imported object until the datasource is re-imported.

So before you **rely** on such a change — spawning Phase 6 sub-agents that reference a new property, building dashboards on it, or shipping a stream that scopes on it — you must **repeat the Checkpoint B cycle**, in this order:

1. **Check the change is actually needed first.** If the value is already covered by the `id`/`name`/`type` mappings it is on every object for free — `rawId` (scalar), `name`, `type` — so don't add a duplicate `properties` entry just to reach it (see the duplicate-property rule in [index-defs.md](references/index-defs.md)). Only proceed when the property genuinely isn't already available.
2. **Redeploy** — invoke `deploy-plugin` so the edited definition/stream ships.
3. **Re-index** — `squaredup index --datasource-id <id> --no-wait --json`, capturing the new `since`.
4. **Poll** — `squaredup index-status --datasource-id <id> --since <since> --json` until `done: true, succeeded: true`.
5. **Confirm the change itself landed — not merely that the import succeeded.** Verify the specific edit is present on a re-imported object: for a new mapped property, run the Confirm command above and inspect a returned object's properties for the new field (or test a scoped stream that reads `{{object.<newProp>}}` and see it resolve to a real value, not `undefined`). Import success alone does not prove the property mapped — a typo'd source column imports cleanly and silently omits the property.

Only once the property is confirmed present on a real object may you tell Phase 6 sub-agents it exists. Skipping this is the root cause of the shipped `undefined === undefined` scope bug — see [testing.md](references/testing.md), "The two-object rule".

---

## Phase 6: Data streams

Data streams are independent files (`dataStreams/<name>.json` + optional `scripts/<name>.js`), and testing each one floods the main context with large raw response bodies. So **build + test each stream in its own sub-agent, spawned in parallel** — don't write or test them inline here. Read [test-agent.md](references/test-agent.md) for the contract; you do **not** need to read [data-streams.md](references/data-streams.md) yourself — the sub-agents do.

For each data stream in the Phase 2 plan, **spawn one build-mode sub-agent (all in a single message)**, passing the `--plugin-id <id> --datasource-id <id>` captured at Checkpoint A plus the stream's **build spec** (endpoint, method, scoping, candidate `pathToData`, planned columns + shapes, any `ui` params/timeframes, and — for a non-real-time endpoint — the data granularity plus a first-test `--timeframe` hint so the default `last1hour` doesn't 404 against aggregated data; see [test-agent.md](references/test-agent.md)). Each sub-agent writes the stream from the spec, tests it (`objects` → `test --object` for scoped; `test` for global), fixes `pathToData`/script/`metadata` until the shaped rows are correct, and returns a compact PASS/FAIL report.

Collect the reports, then **run the reconciliation pass** before Phase 7 — the same three steps as [Phase 5](#phase-5-import-definitions--import-streams), now across the data-stream reports:

1. **Diff the reports** — line up every report's **"API-level discoveries"** section, fixes applied, assumptions, and constraints hit, and spot any fact present in one report but missing from its siblings.
2. **Propagate every API-level discovery to all sibling streams** sharing the endpoint family or scoping (timeframe/granularity limits that 404, payload caps that 500, object property/id names, auth quirks), apply the same edit to each affected stream, and **re-test every stream you changed** by re-spawning its build/test sub-agent. This is where a constraint one stream hit — e.g. a daily-granularity endpoint that 404s on `last1hour`, or the ~6MB response cap that 500s on long timeframes — gets its `timeframes` fix applied to **all** sibling streams on that endpoint, not just the one that found it.
3. **Resolve conflicting assumptions** — if two reports name the same indexed property differently (e.g. `projectId` vs `rawId`), settle it against the real response and fix every stream that filtered on the wrong one, so no stream ships with a scope filter comparing `undefined === undefined`. Don't proceed with an unresolved contradiction.

If resolving a contradiction means **adding or renaming a mapped property** in `indexDefinitions/*.json` (rather than just fixing a stream to use a property that already exists), the imported objects predate that change and don't carry it. Before re-spawning sub-agents that rely on it, **re-run the Checkpoint B cycle** (redeploy → `squaredup index` → poll → confirm the property is present on a re-imported object) per the [re-indexing rule](#re-indexing-rule--a-post-import-definition-change-invalidates-the-imported-objects). Don't tell a sub-agent a property exists on the strength of an unimported definition edit.

`test` sends the **local** stream config against the deployed plugin, so **no redeploy** is needed to test a new or edited stream (including the re-tests above) — only Checkpoints A and B and the final deploy redeploy.

---

## Phase 7: OOB default content — build in a sub-agent

Dashboards are large JSON files and authoring them inline floods the main context. Spawn **one** build-mode sub-agent for all of Phase 7 — a single agent, not one per dashboard, because the dashboards share `manifest.json` and `scopes.json`. The main agent does **not** read [oob-content.md](references/oob-content.md) — the sub-agent does.

Pass in the prompt:

- The versioned plugin dir, plus the `--plugin-id <id> --datasource-id <id>` captured at Checkpoint A.
- The planned dashboards from Phase 2 (top-level summary + one perspective per object type) and the object types.
- The data stream names to build tiles from — the sub-agent reads the stream files itself for columns and parameters.
- Instructions: read `references/oob-content.md`, write `defaultContent/` (manifest, scopes, dashboards) and `scopes.json` (only scopes the dashboards actually use), run `squaredup validate --json` from the plugin dir, and return a compact report — dashboards written, scopes added, validation result, any assumptions or follow-ups.

Resolve anything the report flags before Phase 8.

## Phase 8: Custom types

Write `custom_types.json` — for this and other reusable patterns (built-in properties stream, configValidation steps), read [common-patterns.md](references/common-patterns.md).

---

## Phase 9: Final validate & deploy

Invoke the `deploy-plugin` skill for the final validate, version bump, and deploy.

**Conditional final re-index.** If `indexDefinitions/*.json` or any import stream changed since the last successful import (the Checkpoint B run, or any re-index triggered by the rule above), the deployed plugin's objects still match the **old** definition — the live tenant won't pick up the new shape until the next scheduled import, up to `frequencyMinutes` away (default `720` = 12 hours). So after the final deploy lands, trigger one more import so the deployed objects match the shipped definition:

```bash
squaredup index --datasource-id <id> --no-wait --json
squaredup index-status --datasource-id <id> --since <since> --json   # poll until done: true, succeeded: true
```

Skip this only if no import definition or import stream has changed since the last import. Don't leave the tenant waiting on the scheduled import for a change you just shipped.
