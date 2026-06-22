# Testing data streams

Test data streams against a **deployed, authenticated** plugin so you see exactly what the API returns — including for endpoints that require auth — before you rely on a stream.

> **Audience: testing sub-agents (Phases 5 and 6).** The per-stream test loop is run by sub-agents, not the main agent — see [test-agent.md](test-agent.md) for the delegation contract. The main agent runs only the Checkpoint A auth probe and Checkpoint B import trigger/poll, documented separately in [checkpoints.md](checkpoints.md) — if you are the main agent, read that file instead of this one.

## Mental model

`squaredup test` sends your **local** data stream config to the test endpoint and runs it against a deployed plugin's **authenticated config**. Two consequences:

- You do **not** redeploy to test a new or edited stream — only the deploy in Checkpoint A, the redeploy in Checkpoint B (to ship import steps), and the final deploy need one.
- Testing needs prerequisites in place: a deployed+authenticated config (Checkpoint A) for any stream, **and imported objects** (Checkpoint B) for _scoped_ streams.

## Always run non-interactively

You are in a non-TTY shell, so the CLI's interactive pickers (object, config, data-stream selection) block. On every `test`/`objects` call pass **`--json --silent`** plus the **`--plugin-id <id>` / `--datasource-id <id>`** from your prompt (captured by the main agent at Checkpoint A) — the ids skip a plugin lookup and a datasource lookup per call. Never call `squaredup datasources` yourself; the ids are already in your prompt. Per-flag detail is in the flags table below, and the output-capture caveat in the ⚠️ note before "Reading the output".

## Commands

```bash
# Global / unscoped stream (matches "none" or absent) — no object needed, one test
squaredup test <stream> --plugin-id <pluginId> --datasource-id <datasourceId> --json --silent

# Scoped stream — get object ids, then test against TWO DIFFERENT objects (see "The two-object rule" below)
squaredup objects <stream> --plugin-id <pluginId> --datasource-id <datasourceId> --json --silent   # → { "objects": [ { "id": "...", "name": "..." }, ... ], "truncated": false }
squaredup test <stream> --object <objectId1> --plugin-id <pluginId> --datasource-id <datasourceId> --json --silent
squaredup test <stream> --object <objectId2> --plugin-id <pluginId> --datasource-id <datasourceId> --json --silent
```

All these commands resolve the plugin from `metadata.json` in the current folder (or a path argument). Run them from the versioned plugin directory, e.g. `my-plugin/v1/`.

### Useful flags (shared by `test` / `objects` / `datasources`)

| Flag                   | Applies to        | Purpose                                                                                                                                                                                                                                                                                                                                                                                                  |
| ---------------------- | ----------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--json`               | all               | Machine-readable output; disables interactive prompts. Always use it.                                                                                                                                                                                                                                                                                                                                    |
| `--silent`             | all               | Suppress **all** non-error output, including the stderr progress spinner. Always pair with `--json`; the full safe-capture rule is in the ⚠️ note before "Reading the output".                                                                                                                                                                                                                          |
| `--datasource-id <id>` | `test`, `objects` | Target a specific datasource (plugin config). Always pass the id from your prompt — it skips a datasource lookup on every call, and is strictly required when more than one datasource exists (otherwise the picker blocks in this non-TTY shell).                                                                                                                                                       |
| `--plugin-id <id>`     | all               | Target a deployed plugin by id instead of by name. Always pass the id from your prompt — it skips the `listPlugins` lookup the CLI would otherwise do on every call to resolve the plugin name.                                                                                                                                                                                                          |
| `--object <id>`        | `test`            | Scope a scoped stream to an object (node) id from `squaredup objects`.                                                                                                                                                                                                                                                                                                                                   |
| `--matches <json>`     | `objects`         | Resolve a scope inline instead of from a stream file — pass a `{"sourceType":...}` object. The way to check "did my objects index?" at Checkpoint B, before any scoped stream exists. Mutually exclusive with a stream name. The `@file` form only resolves a real scope — pointing it at an import/global stream (whose `matches` is `none`/absent) finds nothing, so pass inline JSON at Checkpoint B. |
| `--suffix <s>`         | all               | Match a plugin deployed with `deploy --suffix <s>`.                                                                                                                                                                                                                                                                                                                                                      |
| `--timeframe <enum>`   | `test`            | Timeframe to send, e.g. `last1hour`, `last24hours` (default `last1hour`).                                                                                                                                                                                                                                                                                                                                |
| `--ui name=value`      | `test`            | Supply a value for a stream's `ui` fields (repeatable), e.g. `--ui metric=cpu`. For an **`objects`-picker** param, pass node id(s) under the field's `name`, comma-separated for multiple: `--ui project=node-abc,node-def`. This is **different from `--object`** — `--object` fills the scope (`context.objects`); `--ui <name>=<ids>` fills the parameter (`context.config.<name>`).                  |
| `--diagnostic <name>`  | `test`            | Print only the named plugin diagnostic (e.g. `--diagnostic Body`) and exit. **Omits the shaped `data`** — use a plain `--json` or `--data-only` run to see shaped rows.                                                                                                                                                                                                                                  |
| `--data-only`          | `test`            | Print only the shaped data stream response (`data`), skipping the plugin diagnostics. The mirror of `--diagnostic`; the two can't be combined.                                                                                                                                                                                                                                                           |

### Testing a consolidated stream (optional `objects` param)

A stream that is unscoped (`matches: "none"`) but exposes an optional `objects` param — the [consolidation pattern](data-streams.md#one-stream-per-shape) — must be tested in **both** modes, because each exercises a different code path:

```bash
# Account-wide: pass the param EMPTY (not omitted) — returns all rows
squaredup test cost --ui project= --timeframe last7days --plugin-id <id> --datasource-id <id> --json --silent
# Scoped: pass node id(s) under the field name — returns only those object(s)' rows
squaredup test cost --ui project=node-abc,node-def --timeframe last7days --plugin-id <id> --datasource-id <id> --json --silent
```

Confirm the scoped run returns **only** the selected objects' rows (and that two ids return both), and the account-wide run returns rows across all objects.

The `objects <stream>` form resolves the named data stream file's `matches` — so it needs a **scoped** stream. It errors if the stream is **not** scoped (it has no objects), and exits 0 with `{"objects":[]}` when the stream is scoped but nothing is imported yet — an empty list means the import hasn't populated objects yet — report that back to the main agent (which owns the Checkpoint B import loop, see [checkpoints.md](checkpoints.md)) rather than triggering an import yourself. When no scoped stream exists yet, use `--matches '{"sourceType":...}'` to resolve a scope inline instead — see the flags table above.

## Reading the output

`squaredup test --json` returns the test endpoint's full response. Two top-level properties matter — `requests` (the raw API exchange) and `data` (the shaped result). (`completedAt` / `validForSeconds` are timestamps you can ignore.)

> ⚠️ **Pass `--silent` and don't merge stderr into stdout when parsing `--json`.** The JSON payload goes to **stdout**; the progress spinner (`- Running diagnostics for "..."`) goes to **stderr**. `--silent` suppresses that spinner entirely, so `squaredup test ... --json --silent | jq` (or `| ConvertFrom-Json`) is safe by construction — always pass it. Even with `--silent`, never merge stderr into stdout with `2>&1`: a real error line would still corrupt the JSON stream. Pipe stdout only. Also: on Windows there is no `/tmp`; use `$env:TEMP` if you need a scratch file.

### `requests` — the plugin diagnostics (raw API exchange)

The underlying HTTP request(s) and response(s), exactly as the plugin made them. Testing one stream against one object, there is **always a single entry — read `requests[0]`**. (Multiple entries appear only when a run targets several objects at once, which you don't need to do.)

`requests[0].diagnostics[]` is a list of labelled items, each with a `group` (`Request`/`Response`), a `name`, and a `value`:

- `[Request] URL` — the resolved endpoint, including query args
- `[Request] Headers`
- `[Response] Status` — e.g. `200 OK`
- `[Response] Body` — the **raw** payload the API returned
- `[Response] Headers`

**Paged streams:** every page is flattened into this one `diagnostics[]` list, each item tagged with a `pageNum`. A 3-page stream yields three `[Response] Body` items (`pageNum` `1`, `2`, `3`) — read them to inspect each page's raw payload.

Use the diagnostics to confirm the endpoint, query args, and headers resolved as expected (`[Request] URL`), and to see the real response shape so you can set `pathToData` / write the post-request script (`[Response] Body`).

### `data` — the shaped data stream response

The rows SquaredUp returns to the client **after** applying `pathToData`, the post-request script, and the stream's `metadata` (column shaping) — i.e. what a tile would actually display. This is distinct from the raw `[Response] Body` above.

- `data.rows` — an array of rows; each row is an array of **cells**, and every cell is a triple:
    - `raw` — the source value taken from the API response
    - `value` — the typed/shaped value after the column's shape is applied
    - `formatted` — the display string the client renders
- `data.metadata.columns[]` — one per column: `name`, `displayName`, `shapeName` (e.g. `shape_string`), `role`, `visible`.
- `data.metadata.rawRowCount` — the row count.

The `raw → value → formatted` triple is your shaping debugger: if `raw` is correct but `value`/`formatted` are wrong, the column's `metadata`/`valueExpression` is off; if `raw` itself is wrong, `pathToData` or the script is off.

`data` is **absent** when shaping produced nothing (e.g. the request errored). `test` sets a non-zero exit code when any request errored — inspect the error and the `[Response] Body`, fix the stream, and re-test.

### Zooming in

- `squaredup test <stream> --data-only --json --silent` → emits **only** the `data` object (shaped rows + column metadata). The fast path when you only need to check shaping.
- `squaredup test <stream> --diagnostic <name> --json --silent` → emits **only** the named plugin diagnostic (e.g. `--diagnostic Body`) and **omits `data`**. Don't conclude shaping is broken from a `--diagnostic` run — use a plain `--json` or `--data-only` run to see shaped rows.

## The two-object rule for scoped streams

> **A scoped stream that "returns rows" is not proven.** It only passes when tested against **two different objects** _and_ the two results differ — or you give an explicit, plausible reason why identical results are legitimately expected.

A scoped stream is meant to narrow data to the one object it's scoped to. The dangerous failure mode is a filter that _looks_ like it scopes but actually matches everything — so every object gets the same (often account-level) data, and the per-object tile is silently wrong for every object but one. Real example: a script filter `Tags.ProjectId === projectId` where **both sides were `undefined`** (the object had no such property and the stream passed no such input). The comparison `undefined === undefined` is `true`, so it matched untagged account-level rows, returned one plausible row, and shipped — every project's Cost History tile then showed the same account-level total.

Filtering on a **non-existent object property** (the `rawId` / wrong-field-name trap) is the same bug: the field resolves to `undefined`, the comparison degenerates, and the filter matches the wrong set. A single test hides it because the one row looks fine. **Testing two objects exposes it: their results come back identical when they should differ → FAIL.**

**The rule:**

1. Run `squaredup objects <stream> … --json --silent` and pick **two different** object ids (prefer two you'd expect to hold different data).
2. `squaredup test <stream> --object <id1> … --json --silent` **and** `--object <id2> … --json --silent`.
3. **Compare the shaped `data` rows from the two runs:**
    - **Results differ** → the scope is doing its job → **PASS** (assuming shaping is also correct).
    - **Results identical** → **FAIL by default.** Treat it as an unscoped filter (the `undefined === undefined` / non-existent-property trap) until proven otherwise. It only passes if you can state an explicit, plausible reason the two objects genuinely share the value (e.g. both genuinely roll up to one shared billing account) — and that reason goes **in the report**.
4. Also sanity-check that the `[Request] URL` / filter actually references the object's id or a property the object really has — confirm the field name exists in the object, not just that a row came back.

**Unscoped / global / import streams keep the existing single-test pass** — there is no scope to vary, so one test that returns the expected shaped rows is sufficient.

The report must record **both object ids** and a **one-line comparison** of their results (see the return format in [test-agent.md](test-agent.md)). The full write → test → inspect → fix sequence the sub-agent runs lives in [test-agent.md](test-agent.md#the-loop-the-sub-agent-runs); the sections above are the reference each step reaches into.
