# SquaredUp Community Plugins
[![Discourse Users](https://img.shields.io/discourse/topics?server=https%3A%2F%2Fcommunity.squaredup.com&style=flat-square&label=community&color=%23FFC72C)](https://community.squaredup.com)
[![Plugins](https://img.shields.io/github/directory-file-count/squaredup/plugins/plugins?type=dir&label=plugins&style=flat-square)](https://squaredup.com/plugins)
[![GitHub issues](https://img.shields.io/github/issues/squaredup/plugins?style=flat-square)](https://github.com/squaredup/plugins/issues)
[![License](https://img.shields.io/github/license/squaredup/plugins?style=flat-square)](https://github.com/squaredup/plugins/blob/main/LICENSE)

SquaredUp is the operational intelligence platform that enables data-driven IT and engineering teams to make better decisions, faster. [Learn more](https://squaredup.com?utm_source=GitHub).

![SquaredUp dashboard](https://squaredup.com/_next/image/?url=https%3A%2F%2Fcdn.sanity.io%2Fimages%2Fz7wg6mcy%2Fproduction-2025%2F6da89c5baf928de22211e4a632ba4b31efc0b384-1870x1018.png%3Fq%3D100%26fit%3Dmax%26auto%3Dformat&w=1080&q=75)

## About this repository

SquaredUp has 60+ plugins out of the box. This repository contains all community-authored plugins and provides guidance on how to author your own plugin and submit it this repository.

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
> [!NOTE]
> If you're interested in joining our private preview, please contact support@squaredup.com.

### Building with Claude Code (build-plugin skill)

If you have access to [Claude Code](https://claude.ai/code), the `build-plugin` skill can guide you through building a plugin from scratch — from exploring the API all the way to a deployed, tested plugin with dashboards.

**What it does**

The skill walks you through the full process in structured phases:

1. Explores the target API and plans the plugin structure with you
2. Scaffolds all the required files
3. Deploys a working version of your plugin early, then pauses for you to authenticate it (OAuth, API key, or whatever the service uses)
4. Tests imports and indexes objects so real data is flowing before the plugin is finished
5. Builds and tests each data stream against live data as it goes
6. Authors out-of-the-box dashboards

**Prerequisites**

- [Claude Code](https://claude.ai/code) installed
- The `squaredup` CLI installed and logged in (`npm i -g @squaredup/cli`, then `squaredup login`)
- A SquaredUp tenant where you can add and authenticate the plugin

**How to use it**

Open Claude Code in this repository and type:

```
/build-plugin
```

Claude will ask for the API you want to integrate and guide you from there.

> [!TIP]
> **Keeping the skill up to date** — the skill lives in this repository and improves over time. To get the latest version, open a terminal in this folder and run `git pull origin main` before starting a new plugin build.
