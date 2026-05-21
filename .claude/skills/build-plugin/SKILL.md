---
name: build-plugin
description: Guides building a SquaredUp low-code plugin for HTTP/REST APIs, from API exploration through deployment. Use when the user wants to integrate a service with SquaredUp, add a new data source, connect to a third-party tool, "pull data from", or "monitor" any service in SquaredUp.
metadata:
    author: SquaredUp
    version: "0.0.3"
---

# Building a SquaredUp Low-Code Plugin

> **Scope:** Web API-based plugins only. If the target tool has no usable REST API, PowerShell may be a better fit — suggest it and stop.

**Announce at start:** "I'm using the build-plugin skill."

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

Create a TaskCreate task for each phase:

- [ ] **Phase 1** — Explore the API
- [ ] **Phase 2** — Plan the plugin structure
- [ ] **Phase 3** — Scaffold files (icon, file structure, `docs/README.md`)
- [ ] **Phase 4** — Write `metadata.json` and `ui.json` → read [metadata.md](references/metadata.md) and [ui.md](references/ui.md)
- [ ] **Phase 5** — Write import definitions → read [index-defs.md](references/index-defs.md)
- [ ] **Phase 6** — Write data streams → read [data-streams.md](references/data-streams.md)
- [ ] **Phase 7** — Write OOB default content → read [oob-content.md](references/oob-content.md)
- [ ] **Phase 8** — Write `custom_types.json` → read [common-patterns.md](references/common-patterns.md)
- [ ] **Phase 9** — Validate and deploy → invoke the `deploy-plugin` skill

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
    configValidation.json      # preferred: validates config on setup
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
- `configValidation.json`: optional but strongly preferred — see [common-patterns.md](references/common-patterns.md).
- **Single-dashboard rule:** Only create a sub-folder under `defaultContent/` when you have **multiple dashboards** for the same type.

---

## Phases 4–8: Writing Files

Read the corresponding reference file before writing each phase:

| Phase                      | Files                                               | Reference                                                        |
| -------------------------- | --------------------------------------------------- | ---------------------------------------------------------------- |
| 4 — Plugin identity & auth | `metadata.json`, `ui.json`, `configValidation.json` | [metadata.md](references/metadata.md), [ui.md](references/ui.md) |
| 5 — Import definitions     | `indexDefinitions/default.json`                     | [index-defs.md](references/index-defs.md)                        |
| 6 — Data streams           | `dataStreams/*.json`, `scripts/*.js`                | [data-streams.md](references/data-streams.md)                    |
| 7 — OOB default content    | `defaultContent/`, `scopes.json`                    | [oob-content.md](references/oob-content.md)                      |
| 8 — Custom types           | `custom_types.json`                                 | [common-patterns.md](references/common-patterns.md)              |

For reusable patterns (built-in properties stream, configValidation steps), read [common-patterns.md](references/common-patterns.md).

---

## Phase 9: Validate & Deploy

Invoke the `deploy-plugin` skill.
