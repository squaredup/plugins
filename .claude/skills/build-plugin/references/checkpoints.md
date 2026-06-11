# Checkpoints A & B — deploy, authenticate, import

This is the **main agent's** testing reference. It covers the two sequential gates the main agent runs inline: the Checkpoint A auth probe and the Checkpoint B import trigger/poll. The per-stream test loop (reading `squaredup test` output, the fix cycle, flags) lives in [testing.md](testing.md) and is read by the **testing sub-agents only** — the main agent never needs it.

## Mental model

`squaredup test` sends a **local** data stream config to the test endpoint and runs it against a deployed plugin's **authenticated config**. Two consequences:

- No redeploy is needed to test a new or edited stream — only the deploy in Checkpoint A, the redeploy in Checkpoint B (to ship import steps), and the final deploy.
- Testing needs prerequisites in place: a deployed+authenticated config (Checkpoint A) for any stream, **and imported objects** (Checkpoint B) for *scoped* streams.

## Always run non-interactively

You are in a non-TTY shell, so the CLI's interactive pickers (object, config, data-stream selection) block. **Always pass `--json`** and supply ids explicitly via flags.

> ⚠️ **Don't merge stderr into stdout when parsing `--json`.** The JSON payload goes to **stdout**; the progress spinner goes to **stderr**. Piping with `2>&1` merges the spinner into the JSON stream and the parse fails. Pipe stdout only, or redirect stderr away (`2>$null` in PowerShell). On Windows there is no `/tmp`; use `$env:TEMP` for scratch files.

## Checkpoint A: capture the ids once, then probe auth

Once the user has authenticated the config, grab **both** ids and hold onto them for the rest of the session:

```bash
squaredup datasources --json   # → { "pluginId": "plugin-...", "datasources": [ { "id": "config-...", "displayName": "..." } ] }
```

Pass `--plugin-id <id> --datasource-id <id>` on **every** subsequent `test`/`objects` call and **into every sub-agent prompt** (Phases 5–6). If omitted, the CLI re-resolves both on each invocation — two round-trips per call that add up fast across the per-stream loops. (`--datasource-id` alone does **not** skip the plugin lookup — pass both.)

Then probe auth with the configValidation backing stream, repeating until it returns without an auth error:

```bash
squaredup test <validationStream> --plugin-id <pluginId> --datasource-id <id> --json
```

## Checkpoint B: trigger & poll the import

After redeploying the import steps, drive the import via the CLI yourself (no UI, no user pause):

```bash
# 1. Trigger a re-index; capture the `since` poll anchor it emits
squaredup index --datasource-id <id> --json
#    → { "datasourceId": "config-...", "triggered": true, "alreadyRunning": false, "since": 1717000000000 }

# 2. Poll until done, passing that `since` so it pins to the run you just triggered
squaredup index-status --datasource-id <id> --since 1717000000000 --json
#    → { ..., "done": false, "status": "inProgress", "succeeded": null }  # keep polling
#    → { ..., "done": true,  "status": "succeeded",   "succeeded": true, "steps": [ ... ] }  # objects indexed

# 3. Confirm objects now exist — pass an inline scope (no scoped stream exists yet; import streams have no `matches` to resolve)
squaredup objects --matches '{"sourceType":{"type":"equals","value":"<Object Type>"}}' --plugin-id <pluginId> --datasource-id <id> --json   # → non-empty "objects"
```

Notes:

- `index` / `index-status` are **folder-independent** — they need only `--datasource-id <id>` (not `--plugin-id`), since the re-index endpoint is keyed purely on the datasource.
- **Branch on the JSON, not the exit code.** `index-status` exits `0` on every clean read regardless of import state. A failed import is `done: true, succeeded: false` — *not* a non-zero exit. Read the run-level `message` and the per-step `steps[]` (each step has `name`, `status`, `errorReason`, `totalObjectsReceived`, `totalObjectsWritten`) to see **which** step broke and why, fix that import stream, and re-trigger.
- **`status` is the run's lifecycle, not the outcome.** While running it's `ready`/`inProgress`; once `done` it's one of `succeeded`, `failed`, `warning`, or `cancelled`. `succeeded` and `warning` both report `succeeded: true` (a `warning` run finished but a step emitted warnings — check the `steps[]`); `failed` and `cancelled` report `succeeded: false`. A datasource that has never imported reports `status: "notRun"`, `done: false`.
- `--since` is **exclusive** (`scheduledStart > since`): always pass the `since` from `index` so `done` can't latch on a stale previous run.
- If `index` reports `alreadyRunning: true`, it adopted the in-flight run — poll with the `since` it returned. Imports can take several minutes (object import allows up to ~10 min); use a generous overall timeout.
- The `--matches` confirm in step 3 must be **inline JSON** — `--matches @<importStream>.json` only resolves a real scope, and an import stream's `matches` is `none`/absent. Likewise `objects <stream>` needs a scoped stream, which doesn't exist until Phase 6.
