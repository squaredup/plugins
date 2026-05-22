---
name: deploy-plugin
description: Validates and deploys a SquaredUp plugin using the squaredup CLI. Use when validating plugin files, deploying to a SquaredUp tenant, or determining the correct version bump for a plugin change.
---

# Deploying a SquaredUp Plugin

**Announce at start:** "I'm using the deploy-plugin skill."

**Prerequisites:** Node.js 22 or later. Run from the versioned plugin directory (e.g. `my-plugin/v1/`).

---

## Commands

```bash
# Login (interactive)
squaredup login

# Login (non-interactive, for CI)
squaredup login --apiKey <key> --region eu   # regions: us, eu, dev

# Check login status
squaredup status

# Validate (always run before deploy)
squaredup validate              # validate current directory
squaredup validate --watch      # re-validate on every file change
squaredup validate --json       # JSON output — use this flag when running as Claude/AI agent

# Deploy
squaredup deploy --force        # overwrite without confirmation prompt
squaredup deploy --watch        # re-deploy automatically on file changes

# List and delete deployed plugins
squaredup list                  # list all plugins deployed to your tenant
squaredup delete                # interactively select and delete a deployed plugin

# Global flags
squaredup --debug               # verbose output
squaredup --silent              # suppress output
```

Always validate before deploying. The validator catches: missing required fields, unknown keys, invalid matches syntax, broken dashboard references.

---

## Versioning

New plugins start at `1.0.0`. Use semver:

| Change type | Bump |
|---|---|
| Bug fix, docs, icon, metadata tweak | PATCH (`1.0.x`) |
| New stream, new optional config field, new default content | MINOR (`1.x.0`) |
| Deleted/renamed stream, breaking config change | MAJOR (`x.0.0`) |

Every PR that modifies plugin files must include a version bump in `metadata.json`.

**Breaking (MAJOR) changes — do not create a new major version without asking the user first.** It is often possible to avoid the break entirely. If a major version is genuinely needed:
- Create a new versioned folder (e.g. `v2/`) rather than modifying `v1/`
- Mark the removed/changed stream `deprecated` in one release, then remove it in a follow-up major bump

```json
"visibility": { "type": "deprecated", "reason": "Use newStreamName instead" }
```
