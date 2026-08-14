When reviewing code, focus on:

## Pull requests

- **One plugin per pull request.** A PR should add or modify a single plugin. If a change spans several plugins, ask the author to split it into one PR per plugin — this keeps review focused, routes CODEOWNERS correctly, and keeps the per-plugin validate/deploy checks meaningful.
- **The correct PR template must be used** — `Add a new plugin`, `Change to an existing plugin`, or `Miscellaneous change` (see `.github/PULL_REQUEST_TEMPLATE/`). PRs raised without the appropriate template may be closed.

## Versioning

Versions are compared against `main`, because merging is the only point at which a version matters. A PR that modifies an existing plugin must leave `metadata.json` with a `version` higher than the one on `main`. If it doesn't, assume the task is unfinished and prompt to add one.

- **One bump per PR, not per commit.** Once the version is above `main`, later commits and review rounds on the same PR do not each need another bump. Do not ask for one.
- **A new plugin stays at `1.0.0`.** There is no version on `main` to compare against, so it stays at `1.0.0` for the life of the PR however many review rounds it takes. Do not ask for a bump.
- **The major version must match the folder.** A plugin in `v1/` is `1.x.y`, a plugin in `v2/` is `2.x.y`. A new major version folder therefore starts at `<N>.0.0`, not `1.0.0`.
- Breaking changes (e.g. removing or renaming a data stream, significantly changing UI parameters) require a new major version **folder** (e.g. `plugins/MyPlugin/v2/`), not just a version bump within the existing folder. The old folder must remain to avoid breaking existing users.
- An earlier major version is not always present here. Some plugins' earlier versions are closed-source high-code plugins maintained outside this repository, so they start at `v2/` (e.g. `plugins/UptimeRobot/`). A missing `v1/` is not automatically a mistake.

## Security

- Check for hardcoded secrets, API keys, or credentials

## Code formatting

- Follow existing formatting in the repo
- Use consistent naming
- Do not introduce formatting tools or config files unless explicitly requested.
- Do not commit **personal** editor or AI tool configuration (e.g. `.claude/settings.json`, anything matching `*.local.json`) — that belongs in the user's home directory. Shared instructions that the whole project relies on are a different thing and are committed deliberately: `AGENTS.md`, `CLAUDE.md`, `CONTRIBUTING.md`, `.claude/skills/` and `.vscode/settings.json` all belong here.

## CODEOWNERS

- If the user is adding a new plugin, encourage them to update the .github/CODEOWNERS file so they can help review future contributions.

## Suggesting changes

When suggesting changes:

- Assume they will be reviewed by humans
- Optimise for reviewability
- Keep diffs focused and minimal
- If a change is non-obvious, add a short comment explaining intent.
- Comments should explain **why**, not restate **what** the code does
- Use a neutral, professional tone
- Avoid humour, sarcasm, or emojis in code comments
- Include all review comments in the first review, do not add additional review comments to code that hasn't changed since the previous commit.

## File-specific guidelines

### icon.png/svg

- SVG is preferred
- Should be a square icon
- Less than 100KB in size

### Metadata (metadata.json)

- name - Should generally be the lowercase kebab style version of the displayName, e.g. phare or google-sheets
- displayName - Use the correctly styled/cased official product name for display names, e.g. SharePoint NOT sharepoint
- description - One short sentence describing what users can build or monitor. Avoid API or implementation language like Access HaloPSA APIs and query ticket data. Should always be appropriately punctuated, e.g. ending with a full stop.
- schemaVersion - Should be 2.0 or higher.
- version - The version number MUST be increased for any change to the plugin. It can never decrease. If a breaking change is made, the major version number of the plugin should be increased - for example, when deleting a data stream or significantly modifying the UI parameters.
- author.type - Should be `community` for community-contributed plugins, or `labs` for SquaredUp-authored experimental plugins.
- author.name - Should typically be a GitHub username, prefixed with @ OR an organisation name. For example `@username1` or `Contoso Inc.`
- category - Mandatory. Reuse an existing category from other plugins where possible.
- links - Should typically contain two links, one link with `category: source` linking to the GitHub repository, and another link with `category: documentation` linking to the markdown documentation in the repository. The links can be in any order, and there may be other links.

### UI Configuration (ui.json)

- Generally prefer API tokens or OAuth where possible, flag usage of username/password unless the API offers no alternative.
- Check that only strictly required fields are marked as `required: true`. Advanced options should never block first-time success.
- For each field in the array:
    - displayName - First word uppercase, then lowercase (e.g. “Table name", or "API key"). Single value: singular. Multiple values: “(s)" (e.g. Tables name(s)). Do not use “you" “Your" in display names. Keep text neutral, concise, and descriptive.
    - name - Should typically be the camel-cased version of the displayName.
    - help - Do not use tooltips unless they add specific value. Never state the obvious (e.g. “Enter the API key here"). Start with a verb where possible (e.g. “Supports the ServiceNow filtering definition format"). Encourage the author to include a reference link if relevant `Create an API key in the [Phare portal](https://docs.phare.io/api-reference/introduction)`
    - placeholder - Mandatory for text fields. Use example placeholders (especially for URLs or values that follow a fixed pattern, e.g. rootly_xxxxxxxxx or https://organisation.atlassian.net) or “Enter the [data source] [info needed in lowercase]". Use default values instead of hint text where a value is commonly the same across environments (e.g. default ports).
    - title - Should not specify the `title` attribute on any fields.

### Out-of-the-box dashboards (defaultContent/\*_/_.dash.json)

- Dashboard names - Use title case
- Tile names - Use title case
- IDs - All `id` fields must be GUIDs (e.g. `"a1b2c3d4-e5f6-7890-abcd-ef1234567890"`), not arbitrary strings.
- Tiles on a dashboard should NOT use deprecated streams - these are any streams set to { visibility: { type: 'deprecated' }}

### Out-of-the-box dashboard manifest (defaultContent/\*\*/manifest.json)

- If out of the box dashboards are specified, ensure they are included in the manifest.json for the relevant folder.

### Data streams - (dataStreams/\*.json)

- displayName - Use noun-based names describing the returned data, e.g. Tickets. Avoid verbs such as Get, Fetch, Run, Execute.
- description - Typically one sentence only. No full stop at the end. Add relevant clarifications in brackets. Never use two sentences.
- tags - Mandatory. Reuse an existing category from other plugins where possible, never use the plugin's name in a tag.
- objectLimit - If a data stream only processes a single object (e.g. uses `objects[0]` in its expression), suggest either using the `httpRequestScopedSingle` dataSource (HTTP Request with Objects (request per object)) OR setting `objectLimit: 1`.
- timeframe - Data streams that don't support time-based filtering must explicitly declare `"none"` as an available timeframe. Omitting this causes UI warnings and incorrect default behaviour in OOB dashboards.
- Numeric values - Return raw numeric values rather than pre-formatted strings (e.g. return `1234.56` not `"£1,234.56"`). Use column format expressions in dashboards for display formatting.
- Column shapes - Use the `bytes` shape for columns representing byte sizes; SquaredUp will automatically display the most appropriate unit (e.g. 4.2 GB). Check for other applicable semantic shapes such as `timestamp` and `duration`.
- Timestamps - SquaredUp expects ISO 8601 strings for timestamp columns. If the upstream API returns Unix timestamps, the script must convert them.
- Expressions - Where a transformation can be expressed using `map`, prefer it over a mustache-style value expression, or complex processing in a script for performance.
- Deduplication - If multiple data streams share the same API endpoint and differ only by a filter, consider merging them into a single stream with a UI parameter to control the filter.
- ui
    - displayName - First word uppercase, then lowercase (e.g. “Table name"). Single value: singular. Multiple values: “(s)" (e.g. Tables name(s)). Do not use “you" “Your" in display names. Keep text neutral, concise, and descriptive.
    - help - Use extremely sparingly. Never state the obvious. Only use when something important must be understood. Start with a verb where possible (e.g. “Supports the ServiceNow filtering definition format").

### Source types (indexDefinitions/)

- Name source types after how they are referred to in the upstream product or API (e.g. `agent`, `device`). Do not prefix them with the plugin name (e.g. avoid `NinjaOne Device`). A separate friendly display name can be configured if needed (via custom_types.json).

### Documentation - (docs/README.md)

- Should typically start headings from level 1. When embedded in SquaredUp, the headings will be sized appropriately.
- When the docs are embedded in SquaredUp, they are shown under a heading labelled "Need help?". As such, discourage documentation that starts with similar headings, or headings that don't make sense. Avoid headings that repeat the plugin name or use "Overview". A good heading might be something like `# Before you start` or `# Prerequisites`.
- The Setup or Configuration section should appear near the top of the documentation, as the README is shown in-product when a user is configuring the plugin for the first time.
- Encourage the author to include documentation for all UI fields from metadata.json unless otherwise covered by a tooltip or help text.
- Encourage the author to include links to the third-party tool or their documentation when appropriate, e.g. `Browse to [unifi.ui.com](https://unifi.ui.com) > Settings -> API Keys > Create New API Key`
- The language should be neutral and clear, providing guidance on how to setup and use the plugin.
- Note that only the README.md is shown within SquaredUp, so do not apply these rules to other markdown files. The documentation file may use a different filename as long as it matches the URL configured in `metadata.json` under the `links` array.
