# Testing data streams

Test data streams against a **deployed, authenticated** plugin so you see exactly what the API returns — including for endpoints that require auth — before you rely on a stream. Used by Checkpoint A, Phase 5, Checkpoint B, and Phase 6.

## Mental model

`squaredup test` sends your **local** data stream config to the test endpoint and runs it against a deployed plugin's **authenticated config**. Two consequences:

- You do **not** redeploy to test a new or edited stream — only the deploy in Checkpoint A, the redeploy in Checkpoint B (to ship import steps), and the final deploy need one.
- Testing needs prerequisites in place: a deployed+authenticated config (Checkpoint A) for any stream, **and imported objects** (Checkpoint B) for *scoped* streams.

## Always run non-interactively

You are running in a non-TTY shell, so the CLI's interactive pickers (object, config, data-stream selection) can't run and will block. **Always pass `--json`** and supply IDs explicitly via flags. `--json` also gives you parseable output instead of the interactive viewer.

## Capture the plugin and config ids once

The first thing to do once a config exists (Checkpoint A) is grab **both** ids with `squaredup configs --json` and hold onto them for the rest of the session. Then pass `--plugin-id <id> --config <id>` on **every** `test`/`objects` call. If you omit them, the CLI re-resolves them on each invocation — two round-trips per call (`listPlugins` to turn the plugin name into an id, then `listPluginConfigs` to pick the config) that add up fast across the per-stream loops in Phases 5 and 6. Fetching both ids once and threading them through skips those lookups every time.

```bash
squaredup configs --json   # → { "pluginId": "plugin-...", "configs": [ { "id": "config-...", "displayName": "..." } ] }
```

`--config` alone does **not** skip the plugin lookup — `--plugin-id` is what avoids the `listPlugins` round-trip, so pass both.

## Commands

```bash
# Global / unscoped stream (matches "none" or absent) — no object needed
squaredup test <stream> --plugin-id <pluginId> --config <configId> --json

# Scoped stream — first get an object id, then test against it
squaredup objects <stream> --plugin-id <pluginId> --config <configId> --json   # → { "objects": [ { "id": "...", "name": "..." } ], "truncated": false }
squaredup test <stream> --object <objectId> --plugin-id <pluginId> --config <configId> --json
```

All these commands resolve the plugin from `metadata.json` in the current folder (or a path argument). Run them from the versioned plugin directory, e.g. `my-plugin/v1/`.

### Useful flags (shared by `test` / `objects` / `configs`)

| Flag | Applies to | Purpose |
| --- | --- | --- |
| `--json` | all | Machine-readable output; disables interactive prompts. Always use it. |
| `--config <id>` | `test`, `objects` | Target a specific plugin config. Always pass it — capture the id once from `squaredup configs --json` (see above) so the CLI skips a config lookup on every call. Strictly required when more than one config exists, otherwise the picker blocks in this non-TTY shell. |
| `--plugin-id <id>` | all | Target a deployed plugin by id instead of by name. Always pass it — capture the id once from `squaredup configs --json` (it's the `pluginId` field) so the CLI skips the `listPlugins` lookup it would otherwise do on every call to resolve the plugin name. |
| `--object <id>` | `test` | Scope a scoped stream to an object (node) id from `squaredup objects`. |
| `--suffix <s>` | all | Match a plugin deployed with `deploy --suffix <s>`. |
| `--timeframe <enum>` | `test` | Timeframe to send, e.g. `last1hour`, `last24hours` (default `last1hour`). |
| `--ui name=value` | `test` | Supply a value for a parameterised stream's UI field (repeatable), e.g. `--ui metric=cpu`. |
| `--diagnostic <name>` | `test` | Print only the named plugin diagnostic (e.g. `--diagnostic Body`) and exit. **Omits the shaped `data`** — use a plain `--json` or `--data-only` run to see shaped rows. |
| `--data-only` | `test` | Print only the shaped data stream response (`data`), skipping the plugin diagnostics. The mirror of `--diagnostic`; the two can't be combined. |

`squaredup objects` errors if the stream is **not** scoped (it has no objects), and exits 0 with `{"objects":[]}` when the stream is scoped but nothing is imported yet — that empty list is your signal to wait for the import.

## Reading the output

`squaredup test --json` returns the test endpoint's full response. Two top-level properties matter — `requests` (the raw API exchange) and `data` (the shaped result). (`completedAt` / `validForSeconds` are timestamps you can ignore.)

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

- `squaredup test <stream> --data-only --json` → emits **only** the `data` object (shaped rows + column metadata). The fast path when you only need to check shaping.
- `squaredup test <stream> --diagnostic <name> --json` → emits **only** the named plugin diagnostic (e.g. `--diagnostic Body`) and **omits `data`**. Don't conclude shaping is broken from a `--diagnostic` run — use a plain `--json` or `--data-only` run to see shaped rows.

## The per-stream loop (Phase 6)

For each data stream:

1. Write the stream JSON (and script, if needed).
2. Test it, passing the `--plugin-id <id> --config <id>` you captured at Checkpoint A (`objects` → `test --object` for scoped; `test` for global).
3. Inspect the output — the raw `[Response] Body` under `requests[0]`, and the shaped rows under `data`. If the raw payload, shaped rows, or column types are wrong, fix `pathToData` / the script / `metadata` and go back to step 2.
4. Only move to the next stream once it returns correct data. No redeploy required.

## Checkpoint patterns

**Auth probe (Checkpoint A)** — after the user authenticates the config, capture the plugin id and config id, then confirm auth before building anything else. Reuse both on every `test`/`objects` call in Phases 5–6 and Checkpoint B:

```bash
squaredup configs --json                              # → grab "pluginId" and the config "id"; the config now exists
squaredup test <validationStream> --plugin-id <pluginId> --config <id> --json   # repeat until it returns without an auth error
```

**Import poll (Checkpoint B)** — after redeploying import steps and asking the user to run the import:

```bash
squaredup objects <scopedStream> --plugin-id <pluginId> --config <id> --json   # poll until "objects" is non-empty
```

Cap the poll at a few attempts. If it's still empty, ask the user to check the import status in the UI rather than looping indefinitely.
