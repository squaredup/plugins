# Delegating stream testing to sub-agents

Phases 5 and 6 test many streams against the live plugin. Each `squaredup test --json` returns large raw API bodies and shaped rows — running that loop inline floods the main conversation, and the streams end up tested one at a time. Instead, **delegate each stream to its own sub-agent and spawn them in parallel.** The verbose JSON stays in the ephemeral sub-agent context; the main conversation only sees a one-paragraph report per stream, and the streams build/test concurrently.

This is the testing path for **Phase 5** (import streams — test only) and **Phase 6** (data streams — build + test). Checkpoint A's auth probe and Checkpoint B's import trigger/poll stay inline in the main agent — they are single sequential gates everything else depends on, not per-stream work.

## When and how to spawn

Spawn **one sub-agent per stream, all in a single message**, so they run concurrently. This is safe because:

- Each sub-agent edits only **its own** stream file (`dataStreams/<name>.json`) and, if needed, its own `dataStreams/scripts/<name>.js`. No two sub-agents touch the same file.
- `squaredup test` / `squaredup objects` are read-only against the tenant — concurrent calls don't conflict.

Use the Task/Agent tool (`general-purpose` agent). After all reports return, the main agent fixes up anything flagged and moves on.

## Two modes

- **Test-mode (Phase 5 import streams)** — the main agent has already written `indexDefinitions/default.json` and the import streams (they're coupled). The sub-agent does **not** author; it only tests the existing file, reports whether it returns one flat row per object, and proposes a fix if not.
- **Build-mode (Phase 6 data streams)** — the sub-agent **writes** the stream JSON (and a post-request script only if justified) from the spec it's given, then tests and fixes it until the shaped rows are correct.

## Inputs the main agent must pass in the prompt

Always include:

- `--plugin-id <id>` and `--datasource-id <id>` — captured at Checkpoint A. The sub-agent passes both on every `test`/`objects` call so the CLI skips lookups.
- The stream `name` and its file path (e.g. `dataStreams/batterySummary.json`), run from the versioned plugin dir (e.g. `my-plugin/v1/`).
- Whether the stream is **scoped** (needs an object) or **global/unscoped** (no object).
- Which references to read: **`references/testing.md` always**; plus **`references/data-streams.md`** (build-mode data streams) or **`references/index-defs.md`** (import streams) for the authoring/debugging detail.

For **build-mode**, also pass the **build spec** distilled from the Phase 2 plan and Phase 1 API exploration:

- Endpoint path + HTTP method, and scoping → `baseDataSourceName` (`httpRequestScopedSingle` / `httpRequestScoped` / `httpRequestUnscoped`).
- Candidate `pathToData` (where the row array lives in the response).
- Planned columns with `displayName`, `shape`, and any `role` (label/value/timestamp/sourceId…).
- Any `ui` parameters, `timeframes` setting, paging mode, and the `matches` selector.
- The endpoint's **data granularity** (from Phase 1) and, when the stream supports a time range coarser than the default (`timeframes` is an array or `true` at daily/monthly granularity), a **first-test `--timeframe` hint**. `squaredup test` defaults to `last1hour`, which 404s against an endpoint aggregated to daily/monthly (e.g. billing, usage), so tell the sub-agent the timeframe to pass on its first test — e.g. "daily granularity: first test with `--timeframe last7days`". This stops every sub-agent from independently rediscovering the default-timeframe 404. Omit the hint for streams with no time-range control (`timeframes: false`) — there is no timeframe to pass.

The sub-agent owns translating that spec into correct JSON and validating it against the real response — give it intent, not a finished file.

## The loop the sub-agent runs

1. **(Build-mode only)** Write the stream JSON from the spec — and a `scripts/<name>.js` only if the transformation can't be done declaratively (see the script checklist in `data-streams.md`).
2. **Test** — non-interactively, always `--json`. If the spec gave a **`--timeframe` hint** (non-real-time endpoint), pass it on the first test so the default `last1hour` doesn't 404 against aggregated data; widen further only if it still returns nothing.
    - **Scoped** → `squaredup objects <stream> --plugin-id <id> --datasource-id <id> --json --silent` to get object ids, then test against **two different objects**: `squaredup test <stream> --object <objId1> ... --json --silent` **and** `squaredup test <stream> --object <objId2> ... --json --silent`. See "The two-object rule for scoped streams" in `testing.md` — a scoped stream that returns rows for one object is **not** proven; it must return _different_ results for two different objects (or you must justify why identical results are correct).
    - **Global / import (unscoped)** → `squaredup test <stream> --plugin-id <id> --datasource-id <id> --json --silent`. A single test is sufficient — there is no scope to vary.
3. **Inspect** — the raw `[Response] Body` under `requests[0]` and the shaped rows under `data` (see "Reading the output" in `testing.md`). Use the `raw → value → formatted` triple to localise faults: wrong `raw` → `pathToData`/script; wrong `value`/`formatted` → column `metadata`/`valueExpression`. For a scoped stream, also **compare the two objects' rows** — confirm the filter actually narrows to the scoped object and isn't matching everything (the `undefined === undefined` / non-existent-property trap, see `testing.md`).
4. **Fix and re-test** until correct. **No redeploy** — `test` sends the local stream config against the deployed, authenticated plugin.

Non-TTY discipline (full detail in `testing.md`): always pass **both `--json` and `--silent`** (`--silent` suppresses the stderr progress spinner so captured output is pure JSON), supply ids via flags, and **never** merge stderr into stdout (`2>&1`) when parsing — even with `--silent` a real error line on stderr would still corrupt the JSON.

## Return format — keep it compact

The sub-agent's final message is the only thing that reaches the main conversation, so it must be a tight report — **never** raw response bodies or full row sets:

- **Stream name** and **PASS / FAIL**.
- `baseDataSourceName` and the **resolved endpoint** (the `[Request] URL`).
- `pathToData` used, or the script filename if one was needed (and why, in a few words).
- **Column list** — names + shapes.
- **One** sample shaped row, truncated.
- **For scoped streams — the two-object proof (required):** both object ids tested and a **one-line comparison** of their results, e.g. `obj A (id 1a2b, "prod-eu") → 3 rows, total $412; obj B (id 9f8e, "prod-us") → 3 rows, total $97 — differ ✓`. If the two objects returned **identical** results, the report **must** give an explicit, plausible justification for why that is legitimately expected (e.g. "both regions genuinely share one billing account"); without that justification, identical results are a **FAIL**, not a PASS. A scoped stream reported as PASS without two object ids and this comparison is incomplete — treat it as FAIL.
- **API-level discoveries (required section — write "none" if empty):** anything learned about the API itself that is **not specific to this one stream** and could apply to sibling streams sharing the endpoint family, scoping, or auth. This is distinct from the per-stream fixes above — it is the input the main agent reconciles across all sub-agent reports (see "Reconciliation pass" in SKILL.md Phases 5 and 6). Call out, with the concrete value:
    - **Timeframe / granularity constraints** — e.g. "billing data is daily-granularity only; the default `last1hour` timeframe 404s — restricted `timeframes` to `last7days`+".
    - **Payload / response limits** — e.g. "the ~6MB Lambda response cap returns a 500 for timeframes beyond ~30 days; capped `timeframes`".
    - **Object property / id names** — e.g. "the indexed sourceId property is `rawId`, **not** `projectId`; the scope filter must compare against `rawId`". Name the exact property you filtered on.
    - **Auth quirks** — required scopes, header names, token-expiry behaviour, rate limits hit.
      State each discovery as a fact about the API plus the value the sibling streams will need, so the main agent can propagate it without re-deriving it.
- **Unresolved issues / assumptions / follow-ups** for the main agent (e.g. "assumed `id` is the stable sourceId", "endpoint returns 403 without the `read:metrics` scope"). A FAIL must say _why_ and what was tried — never report a silent pass.
