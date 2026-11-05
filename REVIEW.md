When reviewing code, focus on:

## How to review

These rules govern how findings are raised. They exist because the same mistakes recurred across many reviews.

- **The repository's references beat general knowledge.** `.claude/skills/build-plugin/references/` documents how the SquaredUp platform actually behaves (shapes, paging, timeframes, imports, dashboards). Before claiming something is unsupported, broken or undocumented, check there and in the [Platform facts](#platform-facts) section below. Do not reason from generic JavaScript, generic REST, or a vendor's public docs alone.
- **Live results beat documentation.** Plugins are tested against live APIs. When an author reports what the live API or a deployed dashboard actually did, accept it and withdraw the finding. Do not ask authors to undo behaviour or limits they measured.
- **Uncertain API behaviour is a question, not a defect.** If a finding depends on how the upstream API pages, filters or shapes a field, and neither the diff nor the vendor docs prove it, phrase it as a question at Minor severity. Do not raise hypothetical response variants (missing fields, alternative error bodies, malformed values) unless the docs show them.
- **Calibrate severity.** Major or Critical is for data that is wrong, missing or silently empty, broken auth, leaked secrets, or a failed import or deploy. Convention and wording issues are Minor at most.
- **Raise each pattern once.** When the same issue appears in several files (copied scripts, repeated tiles), post one comment that lists every location rather than one comment per file.
- **Everything in the first review.** Do not add new findings on code that has not changed since the previous review. Do not re-raise a finding the author fixed, deliberately declined, or a maintainer overruled.
- **Do not restate the PR description.** Known limitations, release dependencies and declared exceptions the author has already written down are not findings.
- **Do not edit files that should not be committed.** If a PR contains a file that does not belong (see [Code formatting](#code-formatting)), flag it for removal rather than suggesting changes to its contents.
- **Keep the summary current.** Do not repeat withdrawn or resolved findings in the walkthrough, merge-risk or final summaries.

## Pull requests

- **One plugin per pull request.** A PR should add or modify a single plugin. If a change spans several plugins, ask the author to split it into one PR per plugin. This keeps review focused, routes CODEOWNERS correctly, and keeps the per-plugin validate/deploy checks meaningful. The exception is a repository-wide change that the PR description declares as such (for example, removing a field from every plugin); do not raise this rule on those.
- **The correct PR template must be used**: `Add a new plugin`, `Change to an existing plugin`, or `Miscellaneous change` (see `.github/PULL_REQUEST_TEMPLATE/`). Check the PR body actually follows one, with its headings present and the test plan filled in. A body that is free text, or the template picker with no template applied, does not pass. PRs raised without the appropriate template may be closed.

## Versioning

Versions are compared against `main`, because merging is the only point at which a version matters. A PR that modifies an existing plugin must leave `metadata.json` with a `version` higher than the one on `main`. If it doesn't, assume the task is unfinished and prompt to add one.

- **Is this plugin new?** Decide from the diff, not from whether plugin files changed: if `plugins/<Name>/v<N>/metadata.json` is an **added** file in this PR, the plugin (or major version) is new and none of the bump rules below apply to it. Do not request a version bump on a new plugin, and do not tuck one into another finding.
- **One bump per PR, not per commit.** Once the version is above `main`, later commits and review rounds on the same PR do not each need another bump. Do not ask for one.
- **A new plugin stays at `1.0.0`.** There is no version on `main` to compare against, so it stays at `1.0.0` for the life of the PR however many review rounds it takes. Do not ask for a bump. Do flag a new plugin that arrives at any other version (for example `1.0.14`) and ask for `1.0.0`.
- **The major version must match the folder.** A plugin in `v1/` is `1.x.y`, a plugin in `v2/` is `2.x.y`. A new major version folder therefore starts at `<N>.0.0`, not `1.0.0`.
- Breaking changes (e.g. removing or renaming a data stream, significantly changing UI parameters) require a new major version **folder** (e.g. `plugins/MyPlugin/v2/`), not just a version bump within the existing folder. The old folder must remain to avoid breaking existing users. This only applies to plugins that already exist on `main`; an unmerged plugin can change freely.
- **Do not ask to rename source types or object IDs on a plugin already on `main`.** It forces every customer to reimport and breaks their dashboards. Raise it only on new plugins.
- An earlier major version is not always present here. Some plugins' earlier versions are closed-source high-code plugins maintained outside this repository, so they start at `v2/` (e.g. `plugins/UptimeRobot/`). A missing `v1/` is not automatically a mistake.

## Security

- Check for hardcoded secrets, API keys, or credentials, including in debug or log output from scripts.
- Flag imported object names or properties built from URLs that may carry tokens or signed query strings (e.g. webhook URLs).
- Flag URL `pattern` validation that would let a user-supplied base URL send credentials to an unintended host.
- Do **not** require HTTPS-only URL patterns. Self-hosted targets are commonly reached over HTTP through a relay agent, and a `ui.json` pattern cannot depend on the auth mode. At most, suggest a note in the docs.

## Code formatting

- Follow existing formatting in the repo
- Use consistent naming
- Do not introduce formatting tools or config files unless explicitly requested. This includes `cspell.json`, linter configs or similar, anywhere in the repository: flag them for removal.
- Do not commit **personal** editor or AI tool configuration (e.g. `.claude/settings.json`, anything matching `*.local.json`) — that belongs in the user's home directory. Shared instructions that the whole project relies on are a different thing and are committed deliberately: `AGENTS.md`, `CLAUDE.md`, `CONTRIBUTING.md`, `.coderabbit.yaml`, `.claude/skills/` and `.vscode/settings.json` all belong here.
- Flag byte-identical scripts copied across several data streams; a shared script file can be referenced instead.

## CODEOWNERS

- If the user is adding a new plugin, encourage them to update the `.github/CODEOWNERS` file so they can help review future contributions. This is encouraged, not required: do not raise it as a blocking finding.
- Entries must use the anchored, recursive form `/plugins/<Name>/`. `plugins/<Name>/*` only matches direct children, so it misses every file in `v1/`.

## Suggesting changes

When suggesting changes:

- Assume they will be reviewed by humans, and often applied verbatim by AI coding agents. Suggest the smallest change that fixes the problem; do not bundle speculative hardening.
- Optimise for reviewability
- Keep diffs focused and minimal
- If a change is non-obvious, add a short comment explaining intent.
- Comments should explain **why**, not restate **what** the code does
- Use a neutral, professional tone
- Avoid humour, sarcasm, or emojis in code comments
- Include all review comments in the first review, do not add additional review comments to code that hasn't changed since the previous commit.

## Platform facts

SquaredUp behaviour that reviews have repeatedly got wrong. Treat these as established; each was confirmed against live deployments. Where a fact links to the build-plugin references, the reference has the detail.

- **Post-request scripts run once per page.** Logic that needs the whole result set is a bug on a paged stream, and enabling paging is not a fix for it. See [data-streams.md, Post-request scripts](.claude/skills/build-plugin/references/data-streams.md#post-request-scripts).
- **Paging config is not proof the API pages.** A `paging` block can just chain a second request through `pagingContext`, and `mode: none` with a documented limit is right for an endpoint that ignores paging parameters. See [data-streams.md, Pagination](.claude/skills/build-plugin/references/data-streams.md#pagination).
- **Shapes parse and format values.**
    - `date` and `timestamp` columns accept ISO 8601 strings, `YYYY-MM-DD HH:MM:SS+00`-style strings, and numbers when the column declares an `inputFormat` such as `unixSeconds`. Only raw epoch numbers with no `inputFormat` need converting.
    - `bytes`, `kilobytes`, `megabytes`, `gigabytes` and the other data-size shapes all auto-scale. Only flag a shape that doesn't match the unit the API returns.
    - `decimalPlaces`, `thousandsSeparator` and `formatExpression` inside a shape are display formatting, not pre-formatting. So is a `Math.round` that matches the column's `decimalPlaces`.
    - SmartViz applies shapes whichever renderer a tile uses.
    - In a `state` shape, `map` lists the raw values for each state (e.g. `{ "success": ["Good"] }`), so the column still emits the raw labels.
- **SmartViz matching and defaults.** SmartViz is documented by the platform's `squaredup skill visualize`, not in this repository; these points are kept here for reviewers only. Colour and value maps (`colors`, `mappedColors`, row highlights) match keys case-insensitively. `gaugeBands[].to` is a 0–1 fraction of the gauge range, not an absolute value. `ringGridMax` defaults to 100. The scalar `comparison` displays the value it is given; it does not calculate a delta.
- **Mustache expressions.** Unset variables resolve to an empty string; they do not throw. Do not suggest `typeof` guards.
- **Configuration validation warns, it does not block.** A failing `configValidation` step shows a warning; the user can still save the data source.
- **Dashboard variables and pickers.** A perspective tile that declares a variable does not run with an empty selection; it shows "No objects selected". Object pickers only offer objects that have been imported.
- **Tile parameters live under `dataSourceConfig`.** Parameters placed under `dataStream.config` on a tile are silently ignored. Flag them. See [oob-content.md](.claude/skills/build-plugin/references/oob-content.md#auto-scoping-a-stream-via-its-objects-filter).
- **`autocomplete` fields store objects.** The stored value is an array of `{ value, label }` objects, even when single-select. Interpolating it straight into a header, path or query sends `[object Object]`; it needs `.value`.
- **`preRequestScript` needs `showScripting: true`.** Without `base.config.showScripting: true` in `metadata.json`, the platform silently skips the pre-request script and every request goes out unauthenticated.
- **Imports.** Array properties are JSON-stringified when written to the graph, so they cannot be used as correlation join keys. Metadata columns that are not listed are not displayed. The index refreshes on a schedule (hours, not seconds), so fast-changing records such as alerts or incidents belong in live data streams, not imports.

## File-specific guidelines

### icon.png/svg

- SVG is preferred
- Should be a square icon
- Less than 100KB in size
- Should be the vendor's real, current logo. Ask the author to confirm the source if it looks redrawn or generated.

### Metadata (metadata.json)

- name - Should generally be the lowercase kebab style version of the displayName, e.g. phare or google-sheets
- displayName - Use the correctly styled/cased **current** official product name for display names, e.g. SharePoint NOT sharepoint, Checkmk NOT CheckMK. Check the vendor has not renamed the product. The plugin folder name should use the same casing.
- description - One short sentence describing what users can build or monitor. Avoid API or implementation language like Access HaloPSA APIs and query ticket data. Should always be appropriately punctuated, e.g. ending with a full stop.
- schemaVersion - Should be 2.0 or higher.
- version - See [Versioning](#versioning).
- author.type - Should be `community` for community-contributed plugins, or `labs` for SquaredUp-authored experimental plugins.
- author.name - Should typically be a GitHub username, prefixed with @ OR an organisation name. For example `@username1` or `Contoso Inc.`
- category - Mandatory. Reuse an existing category from other plugins where possible. Search the `category` values in other plugins' `metadata.json` before calling one invalid.
- links - Should typically contain two links, one link with `category: source` linking to the GitHub repository, and another link with `category: documentation` linking to the markdown documentation in the repository. The links can be in any order, and there may be other links.

### UI Configuration (ui.json)

- Generally prefer API tokens or OAuth where possible, flag usage of username/password unless the API offers no alternative.
- Check that only strictly required fields are marked as `required: true`. Advanced options should never block first-time success.
- Flag any field named `ignoreCertificateErrors`, and any `ignoreCertificateErrors` mapping in `base.config` in metadata.json. The platform adds this toggle to every plugin built on WebAPI. The only exception is a literal `false` in `base.config`, which deliberately hides it.
- Use a `toggle` for on/off settings, not a two-option dropdown.
- Question configuration fields that expose internals the user has no reason to change (e.g. page limits).
- For each field in the array:
    - displayName - First word uppercase, then lowercase (e.g. “Table name", or "API key"). Single value: singular. Multiple values: “(s)" (e.g. Tables name(s)). Do not use “you" “Your" in display names. Do not repeat the product name (e.g. "API key", not "Contoso API key"). Keep text neutral, concise, and descriptive.
    - name - Should typically be the camel-cased version of the displayName.
    - help - Do not use tooltips unless they add specific value. Never state the obvious (e.g. “Enter the API key here"). Start with a verb where possible (e.g. “Supports the ServiceNow filtering definition format"). Encourage the author to include a reference link if relevant `Create an API key in the [Phare portal](https://docs.phare.io/api-reference/introduction)`
    - placeholder - Mandatory for text fields. Use example placeholders (especially for URLs or values that follow a fixed pattern, e.g. rootly_xxxxxxxxx or https://organisation.atlassian.net) or “Enter the [data source] [info needed in lowercase]". Use default values instead of hint text where a value is commonly the same across environments (e.g. default ports).
    - title - Should not specify the `title` attribute on any fields.

### Out-of-the-box dashboards (defaultContent/\*_/_.dash.json)

- Dashboard names - Use title case
- Tile names - Use title case
- IDs - All `id` fields must be GUIDs (e.g. `"a1b2c3d4-e5f6-7890-abcd-ef1234567890"`), not arbitrary strings.
- Tiles on a dashboard should NOT use deprecated streams - these are any streams set to { visibility: { type: 'deprecated' }}
- Variables - Every variable a tile references must be declared on the dashboard.
- Request volume - Flag overview tiles that send one request per object (per environment, per device) where an imported property or a single list call would do.
- Timeframes - Check the stream's `timeframes` before calling a tile's timeframe redundant or wrong; a stream may only offer one range.

### Out-of-the-box dashboard manifest (defaultContent/\*\*/manifest.json)

- If out of the box dashboards are specified, ensure they are included in the manifest.json for the relevant folder.

### Data streams - (dataStreams/\*.json)

- displayName - Use noun-based names describing the returned data, e.g. Tickets. Avoid verbs such as Get, Fetch, Run, Execute. This applies to the data stream's own name, not to its column names.
- description - Typically one sentence only. No full stop at the end. Add relevant clarifications in brackets. Never use two sentences.
- tags - Required on most data streams. Tags group related streams in the tile editor, so check the set across the plugin rather than stream by stream: flag a tag applied to every stream (it distinguishes nothing) and flag many tags that each cover only one stream (merge them into a broader shared tag). Reuse existing tags from other plugins where it makes sense, and never use the plugin's name in a tag.
- objectLimit - Only applies to scoped streams. If a scoped stream only processes a single object (e.g. uses `objects[0]` in its expression), suggest either using the `httpRequestScopedSingle` dataSource (HTTP Request with Objects (request per object)) OR setting `objectLimit: 1`. Also suggest an `objectLimit` where several objects are joined into one GET request, since long query strings fail with HTTP 414. Never raise it on unscoped (`"matches": "none"`) streams.
- timeframe - Data streams that don't support time-based filtering must explicitly declare that, using either `"timeframes": false` or `"none"` in the timeframe list. Both are accepted; do not ask to switch one for the other. Omitting this causes UI warnings and incorrect default behaviour in OOB dashboards.
- Timeframe filtering - A stream that filters by timeframe must apply both the start and the end. A script that only applies the lower bound, or loops up to now instead of `timeframe.end`, returns wrong rows for closed past windows such as last month.
- Numeric values - Return raw numeric values rather than pre-formatted strings (e.g. return `1234.56` not `"£1,234.56"`). Use column format expressions in dashboards for display formatting. Shape options such as `decimalPlaces` are display formatting and are fine (see [Platform facts](#platform-facts)).
- Sentinel values - Flag API placeholder values (`-1`, `0001-01-01`, `"None"`) passed through as real data; they should become `null`.
- Column shapes - Use the `bytes` shape for columns representing byte sizes; SquaredUp will automatically display the most appropriate unit (e.g. 4.2 GB). Check for other applicable semantic shapes such as `timestamp` and `duration`.
- List values - A column holding several values (tags, topics, addresses) uses `"shape": ["array", { "itemShape": "<shape>" }]`, not a comma-joined string, and not a second display column alongside it. An `objectPropertyPath` column reading a list property declares the same shape.
- Timestamps - SquaredUp expects timestamps the `date` shape can parse (see [Platform facts](#platform-facts)). If the upstream API returns Unix timestamps and the column has no `inputFormat`, the script must convert them. This is a Minor finding.
- Expressions - Where a transformation can be expressed using `map`, prefer it over a mustache-style value expression, or complex processing in a script for performance.
- Deduplication - If multiple data streams share the same API endpoint and differ only by a filter, consider merging them into a single stream with a UI parameter to control the filter.
- Capped results - Flag counts or totals calculated from a list the API caps (e.g. a 2,000-row maximum), and filtering that happens in a script after a capped request. Both silently undercount; the filter or count belongs in the API request.
- Optional request parameters - Omit an optional parameter when it is empty rather than sending an empty string, which many APIs reject.
- ui
    - displayName - First word uppercase, then lowercase (e.g. “Table name"). Single value: singular. Multiple values: “(s)" (e.g. Tables name(s)). Do not use “you" “Your" in display names. Keep text neutral, concise, and descriptive.
    - help - Use extremely sparingly. Never state the obvious. Only use when something important must be understood. Start with a verb where possible (e.g. “Supports the ServiceNow filtering definition format").

### Source types (indexDefinitions/)

- Name source types after how they are referred to in the upstream product or API (e.g. `agent`, `device`). Do not prefix them with the plugin name (e.g. avoid `NinjaOne Device`). A separate friendly display name can be configured if needed (via custom_types.json).
- Object names - Objects imported under a parent (environments under projects, sites under tenants) need names that stay unique across parents, e.g. `<Project> / <Environment>`. Repeated names such as "Production" are indistinguishable in pickers.
- objectMapping.properties - Never use `id`, `state`, `tags`, or a `__`-prefixed name as a property name; they fail the import at graph write. Rename instead, e.g. `{ "status": "state" }` or `{ "checkTags": "tags" }`. `rawId`, `sourceId`, `sourceType`, `name` and `label` are silently overwritten, so mapping them does nothing.
- pageSize - For APIs where a tenant can hold tens of thousands of objects, check the import stream's `pageSize` against both import limits: ~6MB per page and ~220 pages per import run. See the build-plugin skill's index-defs.md, "Large imports". An import or list request with no paging at all against a large collection is a Major finding.
- Optional steps - Import steps on endpoints that need extra scopes, permissions or licences should be marked optional so one missing permission doesn't fail the whole import.

### Documentation - (docs/README.md)

- Should not start with a level 1 heading. The product shows the plugin name above the rendered doc, so the README should open directly with a short overview paragraph and use level 2 headings (`##`) for its sections.
- When the docs are embedded in SquaredUp, they are shown under a heading labelled "Need help?". As such, discourage documentation that starts with similar headings, or headings that don't make sense. Avoid headings that repeat the plugin name or use "Overview". A good heading might be something like `## Before you start` or `## Prerequisites`.
- The Setup or Configuration section should appear near the top of the documentation, as the README is shown in-product when a user is configuring the plugin for the first time.
- Encourage the author to include documentation for all UI fields from metadata.json unless otherwise covered by a tooltip or help text.
- Encourage the author to include links to the third-party tool or their documentation when appropriate, e.g. `Browse to [unifi.ui.com](https://unifi.ui.com) > Settings -> API Keys > Create New API Key`
- The language should be neutral and clear, providing guidance on how to setup and use the plugin.
- Flag boilerplate that is true of every plugin (e.g. "this plugin is read-only") and filler lines that add nothing.
- Note that only the README.md is shown within SquaredUp, so do not apply these rules to other markdown files. The documentation file may use a different filename as long as it matches the URL configured in `metadata.json` under the `links` array.

## Skills and agent instructions (.claude/skills/, AGENTS.md)

- Flag content that duplicates another reference, the PR templates or REVIEW.md; each fact should live in one place.
- Treat edits to a skill's `description` frontmatter as significant: it controls when the skill triggers.
- Do not apply plugin rules (versioning, CODEOWNERS, one plugin per PR) to skill or documentation-only changes.
