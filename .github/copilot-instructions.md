When reviewing code, focus on:

## Versioning
Any diff that touches files inside a plugin directory must include a corresponding change to metadata.json that increases the `version` field. If no version bump is present, assume the task is unfinished and prompt to add one.

## Security
- Check for hardcoded secrets, API keys, or credentials

## Code formatting
- Follow existing formatting in the repo
- Use consistent naming
- Do not introduce formatting tools or config files unless explicitly requested.

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
- author.type - Should always be set to `community`
- author.name - Should typically be a GitHub username, prefixed with @ OR an organisation name. For example `@username1` or `Contoso Inc.`
- category - Mandatory. Reuse an existing category from other plugins where possible.
- importNotSupported - Should be true unless a importDefinition/default.json is included.
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

### Out-of-the-box dashboards (defaultContent/**/*.dash.json)
- Dashboard names - Use title case
- Tile names - Use title case

### Out-of-the-box dashboard manifest (defaultContent/**/manifest.json)
- If out of the box dashboards are specified, ensure they are included in the manifest.json for the relevant folder.

### Data streams - (dataStreams/*.json)
- displayName - Use noun-based names describing the returned data, e.g. Tickets. Avoid verbs such as Get, Fetch, Run, Execute.
- description - Typically one sentence only. No full stop at the end. Add relevant clarifications in brackets. Never use two sentences.
- tags - Mandatory. Reuse an existing category from other plugins where possible.
- ui
  - displayName - First word uppercase, then lowercase (e.g. “Table name"). Single value: singular. Multiple values: “(s)" (e.g. Tables name(s). Do not use "you" "Your" in display names. Keep text neutral, concise, and descriptive.
  - help - Use extremely sparingly. Never state the obvious. Only use when something important must be understood. Start with a verb where possible (e.g. “Supports the ServiceNow filtering definition format").

### Documentation - (docs/README.md)
- Should typically start headings from level 1. When embedded in SquaredUp, the headings will be sized appropriately.
- When the docs are embedded in SquaredUp, they are shown under a heading labelled "Need help?". As such, discourage documentation that starts with similar headings, or headings that don't make sense. Avoid headings that repeat the plugin name or use "Overview". A good heading might be something like `# Before you start` or `# Pre-requisites`.
- Encourage the author to include documentation for all UI fields from metadata.json unless otherwise covered by a tooltip or help text.
- Encourage the author to include links to the third-party tool or their documentation when appropriate, e.g. `Browse to [unifi.ui.com](https://unifi.ui.com) > Settings -> API Keys > Create New API Key`
- The language should be neutral and clear, providing guidance on how to setup and use the plugin.  
- Note that only the README.md is shown within SquaredUp, so do not apply these rules to other markdown files.