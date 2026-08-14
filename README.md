# SquaredUp Community Plugins
[![Discourse Users](https://img.shields.io/discourse/topics?server=https%3A%2F%2Fcommunity.squaredup.com&style=flat-square&label=community&color=%23FFC72C)](https://community.squaredup.com)
[![Plugins](https://img.shields.io/github/directory-file-count/squaredup/plugins/plugins?type=dir&label=plugins&style=flat-square)](https://squaredup.com/plugins)
[![GitHub issues](https://img.shields.io/github/issues/squaredup/plugins?style=flat-square)](https://github.com/squaredup/plugins/issues)
[![License](https://img.shields.io/github/license/squaredup/plugins?style=flat-square)](https://github.com/squaredup/plugins/blob/main/LICENSE)

SquaredUp is the operational intelligence platform that enables data-driven IT and engineering teams to make better decisions, faster. [Learn more](https://squaredup.com?utm_source=GitHub).

![SquaredUp dashboard](https://squaredup.com/_next/image/?url=https%3A%2F%2Fcdn.sanity.io%2Fimages%2Fz7wg6mcy%2Fproduction-2025%2F6da89c5baf928de22211e4a632ba4b31efc0b384-1870x1018.png%3Fq%3D100%26fit%3Dmax%26auto%3Dformat&w=1080&q=75)

## About this repository

SquaredUp has 60+ plugins out of the box. This repository contains all community-authored plugins, the `build-plugin` AI skill used to author them, and guidance on submitting your own plugin here.

### Reporting issues or feature requests

- **Community-authored plugins**: Raise issues or improvement ideas directly in this repo - [create a new issue](https://github.com/squaredup/plugins/issues/new/choose)
- **SquaredUp-authored plugins**: Use [Community Answers](https://community.squaredup.com) or contact support@squaredup.com
- **The SquaredUp platform itself**: Use [Community Answers](https://community.squaredup.com) or contact support@squaredup.com

## What is a plugin?
Plugins are key components of SquaredUp. Each plugin defines how connect to and read data from a third-party system. A plugin typically includes:

* **Plugin metadata** - name, logo, author etc.
* **Data streams** - specify data is queried from a third-party system, typically a wrapper around a certain API endpoint
* **Out of the box dashboards** - useful dashboards to help users get started
* **Index definition** - defines how SquaredUp indexes objects from a third-party system

> [!TIP]
> We use the term `plugins` in code, while the UI refers to them as `data sources`.

[Learn more about plugins](https://docs.squaredup.com/features/connect-and-explore/plugins-and-data-sources)

## How do I use a data source?
- Sign up for an account at app.squaredup.com
- Browse to Data Sources -> +
- Select your desired data source from our catalog
- Configure and add the data source to get started

[Learn more about adding a data source](https://docs.squaredup.com/first-steps/adding-a-data-source)

## How do I build my own plugin?

Plugins are built with the **`build-plugin` AI skill**, which lives in this repository and is generally available to everyone. Point your AI coding agent at it and it takes you from an API reference to a deployed, tested plugin — exploring the API, planning the plugin with you, scaffolding the files, deploying and pausing for you to authenticate, testing every data stream against live data, and authoring out-of-the-box dashboards.

### Prerequisites

- Node.js 22 or later
- The `squaredup` CLI, installed and logged in: `npm i -g @squaredup/cli`, then `squaredup login`
- An AI coding agent — [Claude Code](https://claude.com/claude-code) is recommended
- A SquaredUp organization where you can add and authenticate a data source
- Documentation for the API you want to integrate, and credentials with real data behind them

### Quick start

Clone this repository and start your agent in it:

```bash
git clone https://github.com/squaredup/plugins.git
cd plugins
claude
```

Then ask for the skill:

```
/build-plugin
```

The agent will ask which API you want to integrate and guide you from there. Expect to stay in the loop at three points: supplying the API documentation, approving the plan, and authenticating the plugin in your organization.

> [!TIP]
> The skill improves over time. Run `git pull origin main` in this folder before starting a new plugin build to pick up the latest version.

📺 **[Watch the video introduction and read the full guide](https://docs.squaredup.com/ai-features/building-plugins-with-ai)** — including how to run the skill in agents other than Claude Code (Codex, Cursor, Gemini CLI, GitHub Copilot and [many more](https://github.com/vercel-labs/skills#supported-agents)).

## How do I submit my plugin?

Community-authored plugins are welcome — open a pull request against this repository.

- Add your plugin as `plugins/<PluginName>/v1/`, matching the layout of an existing plugin (`metadata.json`, `ui.json`, `icon.svg`, `dataStreams/`, `indexDefinitions/`, `defaultContent/`, `docs/README.md`)
- Include a logo, at least one dashboard, and a `docs/README.md` covering configuration
- Never commit secrets, API keys or credentials
- For changes to an existing plugin, bump `version` in `metadata.json`. Breaking changes need a new major version folder (e.g. `v2/`) alongside the old one, so existing users aren't broken
- Add yourself to [`.github/CODEOWNERS`](.github/CODEOWNERS) so you're asked to review future changes to your plugin
- **One plugin per pull request** — if your work spans several plugins, raise a separate PR for each
- **Use the matching PR template** — *Add a new plugin*, *Change to an existing plugin*, or *Miscellaneous change*. PRs raised without the appropriate template may be closed

A community moderator will review your PR.

By contributing you agree to our [Code of Conduct](CODE_OF_CONDUCT.md).
