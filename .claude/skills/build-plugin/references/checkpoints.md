# Checkpoints A & B — deploy, authenticate, import

This is the **main agent's** testing reference. It covers the two sequential gates the main agent runs inline: the Checkpoint A auth probe and the Checkpoint B import trigger/poll. The per-stream test loop (reading `squaredup test` output, the fix cycle, flags) lives in [testing.md](testing.md) and is read by the **testing sub-agents only** — the main agent never needs it.

## Mental model

`squaredup test` sends a **local** data stream config to the test endpoint and runs it against a deployed plugin's **authenticated config**. Two consequences:

- No redeploy is needed to test a new or edited stream — only the deploy in Checkpoint A, the redeploy in Checkpoint B (to ship import steps), and the final deploy.
- Testing needs prerequisites in place: a deployed+authenticated config (Checkpoint A) for any stream, **and imported objects** (Checkpoint B) for *scoped* streams.

## Always run non-interactively

You are in a non-TTY shell, so the CLI's interactive pickers (object, config, data-stream selection) block. **Always pass `--json`** and supply ids explicitly via flags.

> ⚠️ **Pass `--silent` and don't merge stderr into stdout when parsing `--json`.** The JSON payload goes to **stdout**; the progress spinner goes to **stderr**. `--silent` suppresses the spinner entirely, so pair it with `--json` on every call to make output capture safe by construction. Even so, never merge stderr into stdout with `2>&1` — a real error line would still corrupt the JSON stream. Pipe stdout only. On Windows there is no `/tmp`; use `$env:TEMP` for scratch files.

## Checkpoint A: capture the ids once, then probe auth

Once the user has authenticated the config, grab **both** ids and hold onto them for the rest of the session:

```bash
squaredup datasources --json --silent   # → { "pluginId": "plugin-...", "datasources": [ { "id": "config-...", "displayName": "..." } ] }
```

Pass `--plugin-id <id> --datasource-id <id>` on **every** subsequent `test`/`objects` call and **into every sub-agent prompt** (Phases 5–6). If omitted, the CLI re-resolves both on each invocation — two round-trips per call that add up fast across the per-stream loops. (`--datasource-id` alone does **not** skip the plugin lookup — pass both.)

Then probe auth with the configValidation backing stream, repeating until it returns without an auth error:

```bash
squaredup test <validationStream> --plugin-id <pluginId> --datasource-id <id> --json --silent
```

## Checkpoint B: trigger & poll the import

After redeploying the import steps, drive the import via the CLI yourself (no UI, no user pause):

```bash
# 1. Trigger a re-index; capture the `since` poll anchor it emits
squaredup index --datasource-id <id> --json --silent
#    → { "datasourceId": "config-...", "triggered": true, "alreadyRunning": false, "since": 1717000000000 }

# 2. Poll until done, passing that `since` so it pins to the run you just triggered
squaredup index-status --datasource-id <id> --since 1717000000000 --json --silent
#    → { ..., "done": false, "status": "inProgress", "succeeded": null }  # keep polling
#    → { ..., "done": true,  "status": "succeeded",   "succeeded": true, "steps": [ ... ] }  # objects indexed

# 3. Confirm objects now exist — pass an inline scope (no scoped stream exists yet; import streams have no `matches` to resolve)
squaredup objects --matches '{"sourceType":{"type":"equals","value":"<Object Type>"}}' --plugin-id <pluginId> --datasource-id <id> --json --silent   # → non-empty "objects"
```

Notes:

- `index` / `index-status` are **folder-independent** — they need only `--datasource-id <id>` (not `--plugin-id`), since the re-index endpoint is keyed purely on the datasource.
- **Branch on the JSON, not the exit code.** `index-status` exits `0` on every clean read regardless of import state. A failed import is `done: true, succeeded: false` — *not* a non-zero exit. Read the run-level `message` and the per-step `steps[]` (each step has `name`, `status`, `errorReason`, `totalObjectsReceived`, `totalObjectsWritten`) to see **which** step broke and why, fix that import stream, and re-trigger.
- **`status` is the run's lifecycle, not the outcome.** While running it's `ready`/`inProgress`; once `done` it's one of `succeeded`, `failed`, `warning`, or `cancelled`. `succeeded` and `warning` both report `succeeded: true` (a `warning` run finished but a step emitted warnings — check the `steps[]`); `failed` and `cancelled` report `succeeded: false`. A datasource that has never imported reports `status: "notRun"`, `done: false`.
- `--since` is **exclusive** (`scheduledStart > since`): always pass the `since` from `index` so `done` can't latch on a stale previous run.
- If `index` reports `alreadyRunning: true`, it adopted the in-flight run — poll with the `since` it returned. Imports can take several minutes (object import allows up to ~10 min); use a generous overall timeout.
- The `--matches` confirm in step 3 must be **inline JSON** — `--matches @<importStream>.json` only resolves a real scope, and an import stream's `matches` is `none`/absent. Likewise `objects <stream>` needs a scoped stream, which doesn't exist until Phase 6.

## A post-import definition change invalidates the imported objects

The objects this import created carry the shape defined by the `indexDefinitions/*.json` and import streams **as they were when the import ran**. Editing either afterwards does **not** retroactively change the objects already in the graph — a newly mapped property is absent on every existing object until the datasource is re-imported. This is the trap behind the shipped `undefined === undefined` scope bug: a property was added to `objectMapping.properties` *after* the import, sub-agents were told it existed, and they filtered on a field that was `undefined` on every object.

So **any** change to `indexDefinitions/*.json` or an import stream after this import has run means you must **repeat this whole Checkpoint B cycle before relying on the change** — before spawning sub-agents that reference a new property or building anything that scopes on it:

1. **First check the change is even needed.** A value already covered by `id`/`name`/`type` is on every object for free (`rawId` as a scalar, `name`, `type`) — don't add a duplicate `properties` mapping to reach it (see [index-defs.md](index-defs.md)). Only re-index for a property that genuinely isn't already available.
2. **Redeploy** the edited definition/stream (invoke `deploy-plugin`).
3. **Re-index** — `squaredup index --datasource-id <id> --json --silent`, capture the new `since`.
4. **Poll** `index-status` until `done: true, succeeded: true`.
5. **Confirm the change itself landed, not just that the import succeeded.** A typo'd source column imports cleanly and silently drops the property, so import success proves nothing about the mapping. Re-run the step-3 `objects --matches` confirm and inspect a returned object for the new property (or test a scoped stream that reads `{{object.<newProp>}}` and see it resolve to a real value). Only then is it safe to tell a sub-agent the property exists.

**Phase 9 corollary.** If import definitions or import streams changed since the last successful import, the **deployed** tenant's objects are also stale — they won't gain the new shape until the next scheduled import (up to `frequencyMinutes`, default 720 = 12h). After the final deploy, trigger one more `index` + poll so the live objects match the shipped definition rather than waiting on the schedule.
