When reviewing code, focus on:

## Versioning
Any diff that touches files inside a plugin directory must include a corresponding change to metadata.json that increases the `version` field. If no version bump is present, assume the task is unfinished and prompt to add one.

## Security
- Check for hardcoded secrets, API keys, or credentials

## Code formatting
* Follow existing formatting in the repo
* Use consistent naming
* Do not introduce formatting tools or config files unless explicitly requested.

## Suggesting changes

When suggesting changes:

* Assume they will be reviewed by humans
* Optimise for reviewability
* Keep diffs focused and minimal
* If a change is non-obvious, add a short comment explaining intent.
* Comments should explain **why**, not restate **what** the code does
* Use a neutral, professional tone
* Avoid humour, sarcasm, or emojis in code comments

## File-specific guidelines

### icon.png/svg
* SVG is preferred
* Should be a square icon
* Less than 100KB in size

### Metadata (metadata.json)
* displayName - Use the correctly styled/cased official product name for display names, e.g. SharePoint NOT sharepoint
* description - One short sentence describing what users can build or monitor. Avoid API or implementation language like Access HaloPSA APIs and query ticket data. Should always be appropriately punctuated, e.g. ending with a full stop.
* version - The version number MUST be increased for any change to the plugin. It can never decrease. If a breaking change is made, the major version number of the plugin should be increased - for example, when deleting a data stream or significantly modifying the UI parameters.
* author.type - Should always be set to `community`
* author.name - Should typically be a GitHub username, prefixed with @. For example @username1
* links - Should typically contain two links, one link with `category: source` linking to the GitHub repository, and another link with `category: documentation` linking to the markdown documentation in the repository. The links can be in any order, and there may be other links. 

### UI Configuration (ui.json)
- Generally prefer API tokens or OAuth where possible, flag usage of username/password unless the API offers no alternative.
- Check that only stricly required fields are marked as `required`. Advanced options should never block first-time success.
- Tooltips - Do not use tooltips unless they add specific value. Never state the obvious (e.g. “Enter the API key here”).
- Placeholder text - Mandatory for text fields. Use example placeholders (especially for URLs) or “Enter the [data source] [info needed in lowercase]”. Use default values instead of hint text where a value is commonly the same across environments (e.g. default ports).
- Do not use “you” “Your” in field names or labels. Keep text neutral, concise, and descriptive.
* Should not specify the `title` attribute on fields

### Out-of-the-box dashboards (*.dash.json)
* Dashboard names - Use title case
* Tile names - Use title case

### Data streams - dataStreams/*.json
* Display name - Use noun-based names describing the returned data, e.g. Tickets. Avoid verbs such as Get, Fetch, Run, Execute
* Description - One sentence only. No full stop at the end. Add relevant clarifications in brackets. Never use two sentences.
* Category - Mandatory. Reuse an existing category from other plugins where possible (e.g. Query).
* ui
  * Field names - First word uppercase, then lowercase (e.g. “Table name”). Single value: singular. Multiple values: “(s)” (e.g. Tables name(s)
  * Tooltips - Use extremely sparingly. Never state the obvious. Only use when something important must be understood. Start with a verb where possible (e.g. “Supports the ServiceNow filtering definition format”).