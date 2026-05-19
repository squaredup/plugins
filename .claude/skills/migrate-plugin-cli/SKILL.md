---
name: migrate-plugin-cli
description: Migrate a SquaredUp JavaScript (High-Code / HCP) plugin to low-code (LCP) with **human-in-the-loop review for every import step, data stream, and post-request script**. Each artifact is written as a `.proposed.json` / `.proposed.js` file the user reviews and edits in their own CLI before it's committed to its final path. Use whenever the user wants the interactive, on-disk propose-refine variant of the migration. Trigger phrases: "migrate plugin interactively", "migrate plugin cli", "migrate with review", "propose each stream before writing", "let me edit each stream before you commit it", "human-in-the-loop migrate".
metadata:
    author: SquaredUp
    version: "0.0.1"
---

# Migrating a SquaredUp High-Code Plugin to Low-Code — Human-in-the-Loop

This skill is the **human-in-the-loop variant** of [`migrate-plugin`](../migrate-plugin/SKILL.md). The HCP→LCP mapping rules, the decision about which `baseDataSourceName` to pick, the declarative-first rule, the abort-if-non-Web-API check, and the file layout are all identical to `migrate-plugin`.

What's different here is the **write protocol for import steps, data streams, and post-request scripts**: instead of writing them straight to their final paths, you write them as `.proposed.json` / `.proposed.js` files, hand control to the user to review and edit on disk, and only commit them after the user replies `done`.

**Announce at start:** "I'm using the migrate-plugin-cli skill — each import step, data stream, and script will be proposed on disk for you to review before I commit it."

> **Scope — Web API HCPs only.** Same scope check as [`migrate-plugin`](../migrate-plugin/SKILL.md). If `handler.js` uses PowerShell, a DB driver, a non-REST cloud SDK, or raw sockets, stop and explain — don't produce stubs.

## Companion skills

- [`migrate-plugin/SKILL.md`](../migrate-plugin/SKILL.md) — **source of truth** for HCP→LCP mappings, phase mechanics, and the rules in each phase. This skill overrides only the *write protocol* for Phases 5 and 6.
- [`build-plugin/SKILL.md`](../build-plugin/SKILL.md) — authoritative reference for the LCP file format. Open it for the exact shape of any LCP artifact.

When this skill says "see migrate-plugin Phase X", read that section before proceeding — don't re-derive its content from scratch.

---

## Required user inputs

Same as [migrate-plugin → Required user inputs](../migrate-plugin/SKILL.md#required-user-inputs):

- **Path to the HCP** — ask via `AskUserQuestion` if not obvious.
- **Author** — always `{ "name": "SquaredUp Labs", "type": "labs" }`, no need to ask.

---

## Phases

Same eight phases as `migrate-plugin`. Phases 5 and 6 use the **propose-refine loop** (defined below). Every other phase uses the original show-and-pause style from `migrate-plugin`.

Create a TodoList:

- [ ] **Phase 1** — Locate and inventory the HCP; abort if non-Web-API — *see migrate-plugin Phase 1*
- [ ] **Phase 2** — Plan the migration (mapping doc) — *see migrate-plugin Phase 2*
- [ ] **Phase 3** — Migrate `metadata.json` — *see migrate-plugin Phase 3* (show-and-pause)
- [ ] **Phase 4** — Migrate `ui.json` — *see migrate-plugin Phase 4* (show-and-pause)
- [ ] **Phase 5** — Migrate import logic — **propose-refine loop, see below**
- [ ] **Phase 6** — Migrate `readDataSource` functions — **propose-refine loop, see below**
- [ ] **Phase 7** — `custom_types.json`, OOB content, `docs/README.md` — *see migrate-plugin Phase 7* (show-and-pause)
- [ ] **Phase 8** — Validate with `squaredup validate --json` and fix — *see migrate-plugin Phase 8*

---

## The propose-refine loop

**Applies to:** import data streams, their `indexDefinitions/default.json` step, read data streams, and any post-request script.
**Does not apply to:** `metadata.json`, `ui.json`, `custom_types.json`, `configValidation.json`, `docs/README.md`, `icon.svg` — those follow the original show-and-pause style.

### File naming

Proposals live **in-place next to their final path**, with `.proposed` inserted before the extension so editors still syntax-highlight them.

For an import object type `installations`:

| Final path | Proposal path |
|---|---|
| `dataStreams/installations.json` | `dataStreams/installations.proposed.json` |
| `indexDefinitions/default.json` (one step within) | `indexDefinitions/installations.step.proposed.json` — a single step object, not the wrapping `{ "steps": [...] }` |
| `dataStreams/scripts/installations.js` | `dataStreams/scripts/installations.proposed.js` |

For a read data stream `device-metrics` (no import step):

| Final path | Proposal path |
|---|---|
| `dataStreams/device-metrics.json` | `dataStreams/device-metrics.proposed.json` |
| `dataStreams/scripts/device-metrics.js` | `dataStreams/scripts/device-metrics.proposed.js` |

### When no script is needed

The declarative-first rule means many streams don't need a `postRequestScript` (see [migrate-plugin Phase 6 → Translate response transformation](../migrate-plugin/SKILL.md#phase-6--migrate-readdatasource-functions--per-stream-json-files)). Even so, **always write the `.proposed.js` file** — the user explicitly wants the slot present so they can override your judgement. When you don't think a script is needed, the file body should be exactly:

```js
// No post-request script needed — this stream is fully declarative.
// Delete this file (or replace its contents with a real script) before signalling 'done'.
```

When ingesting on `done`, if the file still contains the marker comment and nothing else functional, **don't** create `dataStreams/scripts/{name}.js`, and make sure the stream JSON has no `config.postRequestScript` reference. If the user has replaced the marker with real code, treat it as a real script.

### Protocol per artifact

For each import object type (Phase 5) or each read data stream (Phase 6):

1. **Derive the artifact** following the rules in `migrate-plugin` Phase 5 / Phase 6. Don't water down the work — the proposal should be your honest best attempt, not a placeholder.
2. **Write the `.proposed.*` files** with the `Write` tool. Don't write the final-path versions yet.
3. **Announce in one short message.** List the files you wrote and tell the user how to respond. Example:

   > Proposed `installations`:
   > - `dataStreams/installations.proposed.json`
   > - `indexDefinitions/installations.step.proposed.json`
   > - `dataStreams/scripts/installations.proposed.js` *(marker — no script needed unless you say otherwise)*
   >
   > Review/edit any of these, then reply `done` to apply, `cancel` to skip this artifact, or describe changes for me to redo.

4. **Wait for the user.** Don't poll the files, don't do other work on this artifact, and don't move to the next stream — the user owns the proposal during review.
5. **On `done` / `accept`:** ingest the proposals (see below).
6. **On `cancel` / `skip`:** delete the `.proposed.*` files, note the artifact as skipped for the final summary, and move on.
7. **On any other reply** — questions, redirection, change requests — treat it as feedback, **regenerate** the `.proposed.*` files in place (overwriting), and re-announce. Don't write to the final paths until `done`.

### Ingesting on `done`

1. **Read each `.proposed.*` file** with the `Read` tool. Don't assume the contents match what you wrote — the user may have edited.
2. **Validate JSON parses.** If a `.proposed.json` doesn't parse, surface the error to the user and ask them to fix it in the same file. Don't try to "fix" it yourself.
3. **For the stream `.proposed.json`** — rename to the final path (e.g. `dataStreams/installations.proposed.json` → `dataStreams/installations.json`). Use a `Bash`/`PowerShell` move (`Move-Item`) since the file-edit tools can't rename. If renaming isn't ergonomic, use `Read` then `Write` to the final path and delete the proposal.
4. **For the index step `.step.proposed.json`** — read it, then merge into `indexDefinitions/default.json`:
   - If `default.json` doesn't exist yet, create it with `{ "steps": [<this step>] }`.
   - If it exists, read it, append this step to `steps`. If a step with the same `name` already exists (e.g. re-running), replace it instead of duplicating.
   - Delete the `.step.proposed.json`.
5. **For the script `.proposed.js`** —
   - If the body still contains the "No post-request script needed" marker and nothing functional, delete the proposal and **do not** create the script file. Ensure the stream JSON has no `config.postRequestScript` key.
   - Otherwise, rename to the final path and ensure the stream JSON's `config.postRequestScript` references the bare filename (e.g. `"installations.js"`, not a path).
6. **Cross-file consistency check.** After ingesting, verify:
   - Stream JSON's `config.postRequestScript` matches an existing script filename (or is absent if no script).
   - Step JSON's `dataStream.name` matches the stream JSON's `name`.
   - Step JSON's `objectMapping.properties` references columns the stream actually produces (look at the stream's `metadata` block, or any column the script appears to emit).
   - The stream's `baseDataSourceName` is one of the LCP-recognised values.

   If any check fails, **stop** and tell the user before moving on — don't move to the next stream with an inconsistent artifact on disk.

### Editing discipline

- **One artifact at a time.** Don't propose all twelve read streams at once. Walk one end-to-end (propose → wait → ingest), then start the next. Bad mappings on stream 1 propagate if you batch.
- **Don't touch a `.proposed.*` file while the user is reviewing it.** The user owns it. The only time you regenerate is when they explicitly ask for changes.
- **Accept their edits even when they reshape the stream.** If the user changes `baseDataSourceName: "httpRequestScopedSingle"` to `"httpRequestScoped"`, that's the entire point — accept it. Only push back if their edit introduces something that will fail validation (e.g. an unknown `baseDataSourceName`).
- **No silent normalisation.** Don't reorder keys, reformat, or "tidy" the user's edits on ingest. Write what's in the file.

---

## Phase 5 — Migrate import logic (propose-refine)

For **each** `importObjects/*.js` file (or each entry in `handlerConfig.js` `importStages`):

1. Derive the stream + step + script per [migrate-plugin Phase 5](../migrate-plugin/SKILL.md#phase-5--migrate-import-logic--indexdefinitionsdefaultjson--import-data-streams).
2. Run the propose-refine loop above with **all three files** (stream, index step, script — script may be the marker comment if not needed).
3. After `done`, move on to the next import object type.

When every import object type is done, show the user the final `indexDefinitions/default.json` as a single block for an overall sanity check before Phase 6 — this is show-and-pause, not another propose-refine cycle (the per-step content was already accepted individually).

---

## Phase 6 — Migrate `readDataSource` (propose-refine)

For **each** `case` in `handler.js`'s `readDataSource` switch (or each entry in `handlerConfig.js` `dataSourceFns`):

1. Derive the stream + script per [migrate-plugin Phase 6](../migrate-plugin/SKILL.md#phase-6--migrate-readdatasource-functions--per-stream-json-files). Pay special attention to picking the right `baseDataSourceName` and to the declarative-first rule.
2. Run the propose-refine loop with **two files** (stream + script — no index step).
3. After `done`, move on to the next read data stream.

When every read stream is done, pause for a brief review of the `dataStreams/` directory listing before Phase 7.

---

## Phases 1–4, 7, 8 — unchanged

These phases follow [`migrate-plugin/SKILL.md`](../migrate-plugin/SKILL.md) verbatim. They use the original show-and-pause style: you write the file to its final path, show it to the user, and pause for confirmation before continuing. Don't apply the `.proposed.*` pattern to:

- `metadata.json` (Phase 3)
- `ui.json` (Phase 4)
- `custom_types.json` (Phase 7)
- `configValidation.json` (Phase 7, derived from `testConfig`)
- `docs/README.md` (Phase 7)
- `icon.svg` (Phase 7)
- Validation fixes (Phase 8)

If the user explicitly asks for one of those to also be propose-refined, do it — but the default is show-and-pause.

---

## Things that don't translate cleanly

Same caveats as [migrate-plugin → Things that don't translate cleanly](../migrate-plugin/SKILL.md#things-that-dont-translate-cleanly). When you spot one of those situations, flag it in the announce message for the relevant proposal — the user will likely want to edit the proposal to handle it.

---

## Cleanup

At the end of Phase 8, before handing off, search for any leftover `*.proposed.json` or `*.proposed.js` files under the LCP plugin directory:

```
**/*.proposed.json
**/*.proposed.js
```

These shouldn't exist after a clean migration. If any remain, ask the user whether they wanted those artifacts skipped or still need to ingest them — don't delete unilaterally.

Optionally suggest adding `*.proposed.json` and `*.proposed.js` to the plugin repo's `.gitignore` so accidental commits don't carry pending review files.

---

## Style and tone

Same as [migrate-plugin → Style and tone](../migrate-plugin/SKILL.md#style-and-tone). The migrated LCP should read as if authored from scratch. Don't leave migration-trail comments. The git history (and the `.proposed.*` files, until they're cleaned up) are the record of the migration.
