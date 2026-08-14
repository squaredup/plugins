# AGENTS.md

Orientation for AI coding agents working in this repository. It tells you where things are and which document is authoritative for what — it deliberately does not restate the rules those documents contain.

## What this repository is

The community-authored plugins for [SquaredUp](https://squaredup.com), plus the AI skills used to build them. A plugin defines how SquaredUp connects to a third-party API, indexes objects from it, and queries data for dashboards.

Plugins are **low-code**: JSON definitions plus small JavaScript expressions and scripts. There is no build step, no bundler and no local test suite. A plugin is proven by deploying it to a real SquaredUp organization with the `squaredup` CLI and querying live data — so most meaningful work here needs a logged-in CLI and an organization you can authenticate against.

> [!NOTE]
> The code says `plugins`; the SquaredUp UI says **data sources**. Same thing.

## Start with a skill

Three skills live in `.claude/skills/`. They carry the actual procedures — read the relevant `SKILL.md` before improvising an approach.

| Skill | Use it when |
| --- | --- |
| `build-plugin` | Building a new plugin, or adding streams to an existing one. Nine phases from API exploration to a deployed, tested plugin with dashboards. |
| `deploy-plugin` | Validating or deploying a plugin, or working out the right version bump. |
| `convert-dashboard` | Turning an exported platform dashboard JSON into plugin default content. |

Claude Code discovers these automatically (`/build-plugin`). Other agents may need the `SKILL.md` read directly, or installed via `npx skills add squaredup/plugins` — see the [full guide](https://docs.squaredup.com/ai-features/building-plugins-with-ai).

## Where the rules live

Read the relevant file rather than inferring conventions from nearby plugins:

| Document | Authoritative for |
| --- | --- |
| [`REVIEW.md`](REVIEW.md) | Conventions for every file in a plugin — naming, metadata, `ui.json` fields, data streams, dashboards, docs. **Read it before editing anything under `plugins/`.** It is phrased for reviewers, but the same rules govern authoring. |
| [`.claude/skills/deploy-plugin/SKILL.md`](.claude/skills/deploy-plugin/SKILL.md) | CLI commands, `--json` output shapes, and versioning. |
| [`.claude/skills/build-plugin/references/`](.claude/skills/build-plugin/references/) | Per-file depth: `metadata.md`, `ui.md`, `data-streams.md`, `index-defs.md`, `oob-content.md`, `readme.md`, `testing.md`. |
| [`.github/PULL_REQUEST_TEMPLATE/`](.github/PULL_REQUEST_TEMPLATE/) | What a pull request must cover. Three templates: new plugin, change to an existing plugin, miscellaneous. |
| [`CONTRIBUTING.md`](CONTRIBUTING.md) | The contributor signpost — where to go for each kind of change. |
| [`.github/CODEOWNERS`](.github/CODEOWNERS) | Who reviews which plugin. |
| [`CODE_OF_CONDUCT.md`](CODE_OF_CONDUCT.md) | Expected conduct for contributions. |

## Layout

```text
plugins/<PluginName>/v<major>/    one folder per plugin, per major version
.claude/skills/                   build-plugin, deploy-plugin, convert-dashboard
.github/workflows/                validate, deploy and clean up PR plugins
REVIEW.md                         plugin conventions
```

45 plugin version folders currently exist. Only one plugin has a `v2`, so `v1` is the norm.

## Anatomy of a plugin folder

What each file is, in rough order of how universal it is:

| Path | What it is |
| --- | --- |
| `metadata.json` | Identity and configuration: name, version, author, category, base plugin, config template. Every plugin has one. |
| `dataStreams/*.json` | One file per queryable dataset — usually a wrapper around an API endpoint, with the columns it returns. `dataStreams/scripts/` holds JavaScript for streams that need it. |
| `ui.json` | The configuration form a user fills in when adding the data source. |
| `docs/README.md` | Setup documentation, rendered in-product while a user configures the plugin. |
| `defaultContent/**/*.dash.json` | Out-of-the-box dashboards, listed in a sibling `manifest.json`. |
| `indexDefinitions/*.json` | How objects are imported from the API into the SquaredUp graph. |
| `icon.svg` / `icon.png` | The plugin logo. |
| `configValidation.json` | The check run when a user saves their configuration, backed by a data stream. |
| `custom_types.json` | Display names and icons for the object types the plugin imports. |
| `cspell.json` | Per-plugin spellcheck word list, for product names the root list doesn't cover. |
| `correlationRules/`, `preRequest.js`, `screenshots/` | Rare extras, used by one or two plugins each. |

## Tooling

- **Node.js 22 or later**, and the CLI: `npm i -g @squaredup/cli`, then `squaredup login`. Check state with `squaredup status --json`.
- **JSON schemas** — [`.vscode/settings.json`](.vscode/settings.json) maps each plugin file type to its published schema at `schemas.squaredup.com`. Fetch one when you need ground truth on what a field accepts.
- **Formatting** is set by [`.editorconfig`](.editorconfig): UTF-8, LF, 4-space indent for JSON, Markdown and JavaScript, final newline. There is no linter or formatter to run.

## What CI does to your pull request

- **`pr-run.yaml`** diffs against `origin/main` to find changed `plugins/*/v*` folders, then in order: checks the PR touches a single plugin; checks each changed plugin's major version matches its folder, and — for plugins that already exist on `main` — that `metadata.json` version increased (a new plugin has nothing to compare against, so it keeps its initial `<major>.0.0`); runs `squaredup validate --json` on each; and deploys each to a shared organization suffixed with the PR number. Any of those failing fails the check. Results land in a sticky PR comment.
- **`pr-cleanup.yaml`** deletes those PR-suffixed plugins when the PR closes.
- **`main-deploy.yaml`** dispatches to `squaredup/plugins-automation` to release on merge.

So validate locally before you push — CI runs the same command and will block the PR on the same errors.
