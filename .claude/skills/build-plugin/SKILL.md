---
name: build-plugin
description: Guides building a SquaredUp low-code plugin for HTTP/REST APIs, from API exploration through deployment. Use when the user wants to integrate a service with SquaredUp, add a new data source, connect to a third-party tool, "pull data from", or "monitor" any service in SquaredUp.
metadata:
    author: SquaredUp
    version: "0.0.6"
---

# Building a SquaredUp Low-Code Plugin

> **Scope:** Web API-based plugins only. If the target tool has no usable REST API, PowerShell may be a better fit — suggest it and stop.

**Announce at start:** "I'm using the build-plugin skill."

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
- [ ] **Checkpoint A** — Deploy the shell and authenticate (invoke `deploy-plugin`, probe auth) → [testing.md](references/testing.md)
- [ ] **Phase 5** — Write import definitions and import streams; test each → [index-defs.md](references/index-defs.md), [testing.md](references/testing.md)
- [ ] **Checkpoint B** — Redeploy, then trigger + await the import via the CLI so objects exist → [testing.md](references/testing.md)
- [ ] **Phase 6** — Write data streams; test each before moving on → [data-streams.md](references/data-streams.md), [testing.md](references/testing.md)
- [ ] **Phase 7** — Write OOB default content → [oob-content.md](references/oob-content.md)
- [ ] **Phase 8** — Write `custom_types.json` → [common-patterns.md](references/common-patterns.md)
- [ ] **Phase 9** — Final validate and deploy → invoke the `deploy-plugin` skill

---

## Phase 1: Explore the API

Before writing a single file, understand the API. **Use `AskUserQuestion` to ask for API documentation URLs, OpenAPI/Swagger specs, Postman collections, or any other reference material.** You can also search online, but verify you're looking at docs for the exact product/version the user wants.

1. **Find the docs** — Gather URLs or spec files from the user, then fetch and read them.
2. **Identify the object model** — What are the core entities? (e.g. installations, devices, sites). These become the **indexed objects** in SquaredUp — available for drilldown, search, scoping dashboards, and use as variables.
3. **Find the list endpoints** — Used to import objects. Prefer fetching **50–250 records per page** across multiple requests — SquaredUp has a per-page timeout but supports as many paged requests as needed.
4. **Find the data endpoints** — These power data streams. Identify whether each is scoped to a single object, multiple objects, or global (no object context).
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

- `batterySummary` — per-device, current state
- `batteryHistory` — per-device, time-series
- `siteAlarms` — per-installation

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

**Icon:** Find the official brand/product logo (SVG or PNG). Never auto-generate a generic icon — ask the user to supply one if you can't find an official logo.

**Post-process SVG icons if needed.** SquaredUp shows icons on dark/white backgrounds. Fix if the SVG lacks a background or is not square:

1. Set `width="512" height="512" viewBox="0 0 512 512"`
2. Insert `<rect width="512" height="512" fill="BRAND_COLOR"/>` as the first child
3. Wrap paths in `<g transform="translate(X, Y) scale(S)">` for ~10% padding: `S = min(409.6/w, 409.6/h)`, `X = (512−w*S)/2`, `Y = (512−h*S)/2`

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
    - Region: `squaredup status` prints `Region: <region>`. Build the host — `us` → `app.squaredup.com`, any other region → `<region>.app.squaredup.com` (e.g. `eu` → `eu.app.squaredup.com`).
    - Send them to `https://<host>/settings/plugins?addPluginId=<id>` and ask them to authenticate it. **Pause and wait for them to confirm.**
3. **Capture the datasource id** — you already have the `pluginId` from step 1. The datasource only exists once the user authenticates, so run `squaredup datasources --json` now to grab the datasource `id`. Reuse both as `--plugin-id <id> --datasource-id <id>` on every `test`/`objects` call from here on (Phases 5–6, Checkpoint B) so the CLI skips the plugin and datasource lookups each call.
4. **Probe** — run `squaredup test <validationStream> --plugin-id <pluginId> --datasource-id <id> --json` and confirm it returns without an auth error. Repeat until clean.

Do not proceed to Phase 5 until auth is confirmed. See [testing.md](references/testing.md).

---

## Phase 5: Import definitions & import streams

Write `indexDefinitions/default.json` and the unscoped list/import streams it calls. Read [index-defs.md](references/index-defs.md).

Test each import stream as you write it — they are unscoped, so they need no object: `squaredup test <stream> --plugin-id <pluginId> --datasource-id <id> --json` (reusing the plugin and datasource ids captured at Checkpoint A). Inspect the returned rows and fix until each returns one flat row per object. See [testing.md](references/testing.md).

---

## Checkpoint B: Redeploy & run the first import

Scoped data streams can't be tested until objects exist, which means the import steps must be live and an import must have run. The CLI triggers and tracks the import for you, so **drive it yourself — don't ask the user to run it in the UI.**

1. **Redeploy** — invoke `deploy-plugin` again so the new import steps ship. The import definitions only take effect once this redeploy lands, so the import must run _after_ it.
2. **Trigger** — `squaredup index --datasource-id <id> --json`. This re-indexes the datasource and returns immediately with a `since` anchor; capture it. (If an import was already running it reports `alreadyRunning: true` and adopts that run — poll with the `since` it returns either way.)
3. **Wait** — poll `squaredup index-status --datasource-id <id> --since <since> --json` until `done` is `true`, passing the `since` from step 2. `succeeded: true` means objects are indexed; `succeeded: false` means the import failed — read the run-level `message` and the per-step `steps[]` (which step has `status: "failed"` and its `errorReason`) to pinpoint the break, fix that import stream, and re-trigger before continuing. Imports can take several minutes; use a generous timeout. See [testing.md](references/testing.md).
4. **Confirm** — check objects landed with an **inline scope**: `squaredup objects --matches '{"sourceType":{"type":"equals","value":"<Object Type>"}}' --plugin-id <pluginId> --datasource-id <id> --json` should return a non-empty list. `<Object Type>` is a `sourceType` from the `objectTypes` you defined in `metadata.json` / `indexDefinitions/default.json`. Use `--matches` here, **not** `objects <stream>`: that form resolves a data stream file's `matches`, but no scoped data stream exists yet (those come in Phase 6) and the import streams written so far have no `matches` to resolve. For the same reason, pass **inline** JSON — `--matches @<importStream>.json` won't work, as an import stream's `matches` is `none`/absent.

---

## Phase 6: Data streams

Write `dataStreams/*.json` and any `scripts/*.js`. Read [data-streams.md](references/data-streams.md).

**Test every stream before moving to the next** (full loop in [testing.md](references/testing.md)):

Pass the `--plugin-id <id> --datasource-id <id>` you captured at Checkpoint A on every call (it saves the CLI a plugin and datasource lookup each time):

- **Scoped stream** → `squaredup objects <stream> --plugin-id <pluginId> --datasource-id <id> --json` to get an object id, then `squaredup test <stream> --object <objId> --plugin-id <pluginId> --datasource-id <id> --json`.
- **Global stream** → `squaredup test <stream> --plugin-id <pluginId> --datasource-id <id> --json`.

Inspect the output (the `[Request] URL` and raw `[Response] Body` under `requests[0]`, and the shaped rows under `data`), fix `pathToData`/scripts/metadata, and re-test until correct. `test` sends your **local** stream config, so you do **not** redeploy to test a new or edited stream — only Checkpoints A and B and the final deploy need a redeploy.

---

## Phases 7–8: OOB content & custom types

| Phase                   | Files                            | Reference                                           |
| ----------------------- | -------------------------------- | --------------------------------------------------- |
| 7 — OOB default content | `defaultContent/`, `scopes.json` | [oob-content.md](references/oob-content.md)         |
| 8 — Custom types        | `custom_types.json`              | [common-patterns.md](references/common-patterns.md) |

For reusable patterns (built-in properties stream, configValidation steps), read [common-patterns.md](references/common-patterns.md).

---

## Phase 9: Final validate & deploy

Invoke the `deploy-plugin` skill for the final validate, version bump, and deploy.
