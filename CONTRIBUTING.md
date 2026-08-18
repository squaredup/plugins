# Contributing

Thanks for contributing to the SquaredUp community plugins. This page is a signpost — each link below is the authoritative place for that topic.

## Before you start

| If you're… | Read |
| --- | --- |
| Building a new plugin | [Building plugins with AI](https://docs.squaredup.com/ai-features/building-plugins-with-ai) for the video introduction and full walkthrough, or the [quick start](README.md#how-do-i-build-my-own-plugin) in the README |
| Changing an existing plugin | [REVIEW.md](REVIEW.md) — the conventions every file in a plugin must follow, and what your PR is reviewed against |
| Working with an AI coding agent | [AGENTS.md](AGENTS.md) — orients an agent around the repository and points it at the right documents |

## Raising a pull request

See [How do I submit my plugin?](README.md#how-do-i-submit-my-plugin) in the README for what a PR needs, and [Pull requests](REVIEW.md#pull-requests) in REVIEW.md for the rules on PR scope and templates. Two of those catch people out most often:

- One plugin per pull request
- Choose the matching template — *Add a new plugin*, *Change to an existing plugin*, or *Miscellaneous change*

CI checks PR scope and plugin versions, then validates and deploys every changed plugin. Running `squaredup validate` locally first saves a round trip.

## Reporting issues

Bug reports and feature requests belong in [issues](https://github.com/squaredup/plugins/issues/new/choose) for community-authored plugins. For SquaredUp-authored plugins or the platform itself, use [Community Answers](https://community.squaredup.com) or contact support@squaredup.com — see [Reporting issues or feature requests](README.md#reporting-issues-or-feature-requests).

## Conduct

All contributions are covered by our [Code of Conduct](CODE_OF_CONDUCT.md).
