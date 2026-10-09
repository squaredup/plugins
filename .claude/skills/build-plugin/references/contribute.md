# Phase 10 (optional) — Contribute the plugin back

This is the **main agent's** reference for raising a pull request that contributes the finished plugin to the community repository, [`squaredup/plugins`](https://github.com/squaredup/plugins). Everything here is outward-facing: once pushed, the plugin and the PR description are **public**, and git history keeps anything that was ever committed. Treat every step below as a gate, not a formality.

The repository's own documents stay authoritative — read them at run time rather than relying on this summary:

- [`README.md`](../../../../README.md#how-do-i-submit-my-plugin) — "How do I submit my plugin?"
- [`REVIEW.md`](../../../../REVIEW.md#pull-requests) — the PR rules and every file convention the PR is reviewed against
- [`.github/PULL_REQUEST_TEMPLATE/`](../../../../.github/PULL_REQUEST_TEMPLATE/) — the templates the PR body must follow

## 1. Ask first — always

**Never start this phase without an explicit yes.** Ask with `AskUserQuestion` after Phase 9's final deploy, even in autonomous mode and even if the user waived the Phase 2 approval gate — that waiver covers planning, not publishing their work.

Explain in one or two sentences what contributing means — the plugin is published under a public pull request, reviewed by a community moderator, and available to every SquaredUp user once merged — then offer:

- `Yes — prepare a pull request` → continue with step 2
- `No — keep it private` → stop; the plugin stays in their tenant only
- `Not yet` → stop, and tell them they can ask for this step later

A plugin built for an internal-only system (a home-grown API, a single company's private service) is rarely useful to the community. If that is what was built, say so when asking — don't talk them out of it, but don't assume it fits either.

## 2. Preconditions

Confirm each before touching git. Stop and tell the user what's missing if any fails.

1. **Phase 9 is done** — the final `squaredup validate --json` passes and the final deploy succeeded. CI runs the same validation and blocks the PR on the same errors.
2. **GitHub CLI** — run `gh auth status`. If it succeeds, continue. If `gh` is installed but not logged in, ask the user to run `! gh auth login`. If `gh` isn't installed, ask with `AskUserQuestion`:
    - `Install the GitHub CLI (recommended)` → point them to [cli.github.com](https://cli.github.com) (`winget install --id GitHub.cli` on Windows, `brew install gh` on macOS, or their Linux package manager), then `! gh auth login`, and re-run `gh auth status`.
    - `Continue without it` → follow the [without the GitHub CLI](#without-the-github-cli) path wherever a step below uses `gh`. It needs `git` able to push to GitHub, and the user finishes the PR in their browser.

    Never ask for, paste or store a GitHub token to work around a missing login.
3. **A clone of `squaredup/plugins`** — run `git remote -v` in the working directory. If it isn't a clone of `squaredup/plugins` (the skill may have been installed with `npx skills add` into an unrelated folder), fork-and-clone into a fresh directory (`gh repo fork squaredup/plugins --clone`) and copy the finished `plugins/<PluginName>/v<N>/` folder into it.
4. **New plugin or change?** — `git fetch origin main`, then `git ls-tree -d origin/main plugins/<PluginName>`. Absent on `main` → **new plugin**; present → **change to an existing plugin**. This decides the template (step 6) and the version rule:
    - New plugin: `metadata.json` stays at `<major>.0.0` matching its `v<major>` folder.
    - Change: `version` must be higher than on `main` — invoke `deploy-plugin` for the bump if Phase 9 didn't.
5. **Push access** — `gh repo view squaredup/plugins --json viewerPermission`. `WRITE`, `MAINTAIN` or `ADMIN` → push a branch to `squaredup/plugins` directly. Anything else → push to the user's fork (`gh repo fork squaredup/plugins --remote`, which adds it as a remote) and open the PR from there.

### Without the GitHub CLI

Each `gh` step has a git-and-browser equivalent:

| Step | Instead of `gh` |
| --- | --- |
| Clone (precondition 3) | The user forks at [github.com/squaredup/plugins/fork](https://github.com/squaredup/plugins/fork) (or skips forking if they have write access), then `git clone` that repository |
| Push access (precondition 5) | Push to `origin` in step 7. A `403` or `Permission denied` means no write access: ask the user to fork in the browser, then `git remote add fork https://github.com/<login>/plugins.git` and push there instead |
| Open the PR (step 7) | Give the user a link to the compare page instead of running `gh pr create` — see step 7 |

If `git push` fails on authentication (not permissions), stop: the user needs working git credentials for GitHub, and installing `gh` and running `gh auth login` is the simplest way to get them.

## 3. Sensitivity review

The plugin was built and tested against the user's own tenant and their own account with the vendor, so it is easy for their organisation's details to leak into the files. The repository's PR template asks the author to confirm **"No secrets or credentials included"** — this step is how that box is earned. Do it every time, in full, even for a small change.

### What to look for

| Category | Examples |
| --- | --- |
| **Secrets** | API keys, tokens, passwords, client secrets, bearer/basic `Authorization` values, JWTs, private keys (`-----BEGIN`), webhook URLs carrying a token, connection strings, signed URLs |
| **Organisation-specific hosts** | The user's instance URL or subdomain (`acme.atlassian.net`, `acme.zendesk.com`), internal hostnames, private IP ranges (`10.`, `172.16–31.`, `192.168.`), VPN or intranet links |
| **Identifiers from the user's tenant or vendor account** | Account, tenant, workspace, project, org or subscription IDs; SquaredUp `config-…`, `plugin-…`, `node-…`, workspace or dashboard IDs; object IDs from the import. Default content must use the [templating tokens](oob-content.md#templating-tokens) (`{{configId}}`, `{{workspaceId}}`, `{{scopes.[…]}}`), never a real ID |
| **People and organisation names** | Colleagues' names or emails, customer names, team names, the company name — in placeholders, examples, sample data, dashboard titles, tile text or README walkthroughs |
| **Internal tools and process** | References to internal wikis, Slack/Teams channels, ticket numbers, runbooks, internal-only product names, "ask IT to…" — anything a stranger can't act on |
| **Values pinned to one environment** | `ui.json` defaults or placeholders holding the user's real values instead of a generic example; filters or scopes hardcoded to their objects; dashboards that only make sense with their data |

### How to look

1. **Build a list of known values from this session.** You already hold most of what can leak: the `tenantName` from `squaredup status --json`, the `pluginId` and datasource `id` and `displayName` from Checkpoint A, the base URL and any non-secret config values the user entered, object names and IDs seen during testing, and the user's email domain. Grep the plugin folder for each literally (case-insensitive). Ask the user for anything else worth checking — company name, internal domains, product codenames.
2. **Pattern sweep.** Grep the plugin folder for generic secret and identifier shapes, e.g.:

    ```bash
    grep -rniE "(api[_-]?key|secret|token|passw(or)?d|bearer|authorization|-----BEGIN|eyJ[a-zA-Z0-9_-]{10,}|https?://[^\"' ]*\?(.*&)?(sig|token|key)=|config-[0-9a-z]{8,}|plugin-[0-9a-z]{8,}|node-[0-9a-z]{8,}|@[a-z0-9.-]+\.(com|net|org|io|co\.uk)|\b(10|192\.168|172\.(1[6-9]|2[0-9]|3[01]))\.[0-9]+\.[0-9]+)" plugins/<PluginName>/
    ```

    A hit is a prompt to look, not a verdict — `ui.json` field names like `apiKey` and `{{apiKey}}` header templates are expected. Only a **value** is a leak.
3. **Read every file.** Patterns miss names, internal tools and environment-specific content. Spawn **one general-purpose sub-agent**, told not to edit anything, to read every file in the plugin folder in full (dashboards are large — don't read them inline; and don't use an `Explore` agent, which skims excerpts rather than reading whole files) against the table above, including the known-values list from step 1, and return only findings as `file:line — category — the offending text — suggested generic replacement`. Images (`icon.*`, `screenshots/`) are part of this: it should view them, not skip them.
4. **Check history, not just the final files.** Anything committed on the branch is published with it, even if a later commit removed it. If the plugin has commits of its own, run `git log -p origin/main..HEAD -- plugins/<PluginName>` through the same sweep. If a secret appears anywhere in history, don't push that branch — build a fresh branch from `origin/main` with only the clean files (step 5), and tell the user to **rotate the credential** regardless, since it may already exist elsewhere.
5. **Check what else would ship.** The PR must contain the plugin folder plus, optionally, a `.github/CODEOWNERS` line. Personal configuration (`.claude/settings.json`, `*.local.json`, `.env`, scratch test output) must not be staged.

### Resolve with the user

Show every finding to the user — grouped by file, with your suggested replacement — and fix them only with their agreement. Some will be judgement calls (is that hostname the vendor's public API or their private instance?) that only the user can answer. When a value has to be generalised, replace it with a neutral example in the style [REVIEW.md](../../../../REVIEW.md) asks for (e.g. `https://organisation.atlassian.net`, `rootly_xxxxxxxxx`).

After fixing, **re-run `squaredup validate --json`** and redeploy with `deploy-plugin` if anything other than docs changed, so the PR ships what was tested. Re-run the sweep until it comes back clean, then tell the user plainly that it did.

## 4. Screenshots

The *Add a new plugin* template asks for screenshots of the plugin's configuration and its default dashboards. They make review much faster, so **encourage the user to add them** — but they're also the easiest place to leak the very data step 3 just removed, because they show real tenant data.

Ask the user whether they'd like to include screenshots and, if so, give them this checklist before they take or share any:

- Use the default dashboards on a data source whose objects are safe to show, or crop/blur object names, hostnames, IPs, account IDs and people's names.
- Crop out the browser address bar, the SquaredUp organisation name and workspace names, and the user's avatar or email in the navigation.
- On the configuration screen, make sure credential fields are empty or masked — never a visible API key, even a revoked one.
- Check every tile, including table rows and legends, not just titles.

If the user gives you the image files, **view each one** with `Read` and report anything sensitive you can see before they're used — don't assume they've been cropped.

Screenshots go in the **PR description**, not the repository: `gh` can't upload images, so the user drags them into the PR's description in the GitHub web editor after it is created. Leave the template's screenshot headings in place with a short note so they know where they belong. Only add a `screenshots/` folder to the plugin if the user specifically wants images in-product.

## 5. Branch and commit

1. **Branch from current `main`**: `git fetch origin main && git switch -c plugins/<PluginName> origin/main`, then bring in the plugin folder (it may already be on a working branch — copy or check out just `plugins/<PluginName>/` from it rather than merging unrelated history).
2. **CODEOWNERS** — for a new plugin, the README asks contributors to add themselves to [`.github/CODEOWNERS`](../../../../.github/CODEOWNERS) so they review future changes. Ask the user for their GitHub handle (it may differ from `author.name` in `metadata.json`) and add a line in the existing style: `plugins/<PluginName>/* @handle`. Skip it if they decline.
3. **Stage explicitly** — `git add plugins/<PluginName> .github/CODEOWNERS`, never `git add -A`. Then confirm the scope the same way CI does:

    ```bash
    git diff --name-only --cached origin/main | grep -oE 'plugins/[^/]+' | sort -u   # must print exactly one plugin
    git diff --name-only --cached origin/main                                         # nothing outside the plugin folder and CODEOWNERS
    ```

4. **Commit** with a message in the repository's style — `Add <displayName> plugin` for a new plugin, or a short imperative summary of the change for an existing one.

## 6. Write the PR description from the template

The repository requires the **matching template**, and PRs raised without it may be closed. Read the template file at run time — don't write the body from memory:

- New plugin → `.github/PULL_REQUEST_TEMPLATE/Add a new plugin.md`
- Change to an existing plugin → `.github/PULL_REQUEST_TEMPLATE/Change to an existing plugin.md`

Keep every heading and checklist in the template's order and fill each section from what this build actually produced. Write the body to a file (e.g. in your scratch directory) so it can be shown to the user and passed to `gh`.

| Template section | Fill it from |
| --- | --- |
| Plugin overview / Summary | `metadata.json` (`displayName`, `description`), the Phase 2 plan, and the auth mechanism from `ui.json` |
| Screenshots | Leave the headings with a note for the user to drag images in (step 4) |
| Test plan / Testing | What was **actually** run against a live, authenticated deployment: the Checkpoint A auth probe, the Checkpoint B import (object types and counts), each data stream's PASS report from Phases 5–6, and the default dashboards rendering. The template says "Validation is not testing" — don't offer `squaredup validate` as the test plan |
| Known limitations | The finalised **Known limitations** section of `docs/README.md` (Phase 9) |
| Type of change / Breaking changes / Documentation | The real diff. A removed or renamed data stream, or significantly changed UI parameters, is breaking and needs a new major version folder — see [REVIEW.md](../../../../REVIEW.md#versioning) |
| Checklist | Tick only items you have verified (single plugin, logo, dashboards, README, naming checked against REVIEW.md, no secrets — step 3). The Code of Conduct item is ticked only as described below |

Take the HTML comment prompts out once a section is filled. Don't add sections the template doesn't have, and don't put tenant details, internal links or anything step 3 removed back into the description.

### Code of Conduct

The checklist's "I agree to the Code of Conduct" is the user's agreement, so **ask them for it explicitly** — a yes to contributing, or to any earlier question, is not agreement. Link [`CODE_OF_CONDUCT.md`](../../../../CODE_OF_CONDUCT.md) (offer to summarise it if they want), then ask with `AskUserQuestion`:

- `I agree to the Code of Conduct` → tick the box
- `I don't agree` → leave it unticked and stop: the README says contributing means agreeing to it, so don't raise the PR. Tell the user the plugin is still deployed in their tenant.

Tick the box **only** on that explicit `I agree`. Any other answer (including "Other" or a question) is not agreement — answer it and ask again.

**Title**: `Add <displayName> plugin` for a new plugin, matching existing PRs; a short imperative summary for a change.

## 7. Confirm, push and open the PR

Before anything leaves the machine, show the user:

- the list of files that will be pushed (`git diff --name-only origin/main...HEAD`),
- the PR title and the full description,
- where it will be pushed (`squaredup/plugins` or their fork),

and ask with `AskUserQuestion`: `Open the pull request`, `Open it as a draft`, or `Make changes first`. Only on approval:

```bash
git push -u <remote> plugins/<PluginName>
gh pr create --repo squaredup/plugins --base main \
    --head <owner>:plugins/<PluginName> \
    --title "<title>" --body-file <body-file> [--draft]
```

`<owner>` is `squaredup` when pushing directly, or the user's GitHub login when pushing to their fork.

**Without the GitHub CLI**, push with `git` as above, then give the user this link to open the PR in their browser (URL-encode the title):

```text
https://github.com/squaredup/plugins/compare/main...<owner>:plugins/<PluginName>?expand=1&title=<title>
```

Print the PR description for them to paste into the description box — don't put it in the URL, which is too long for a full template — and tell them to use the arrow next to **Create pull request** if they wanted a draft. Ask them to share the PR URL once it's created.

## 8. Hand over — what happens next

Give the user the PR URL and remind them of anything still theirs to do:

- **Add screenshots now** if they chose to — edit the PR description on GitHub and drag the vetted images under the screenshot headings.

Then show them what happens next, in this order:

1. **Automated checks** — CI checks the PR changes a single plugin with a valid version, validates it, and deploys it to a shared SquaredUp organisation for testing. The results appear as a comment on the PR.
2. **CodeRabbit review** — CodeRabbit automatically reviews the PR and leaves feedback as comments. Address each one by pushing a fix to the same branch or replying to explain why not — they can ask you for help with either.
3. **SquaredUp team review** — a member of the SquaredUp team reviews the plugin against [REVIEW.md](../../../../REVIEW.md), may ask for changes, and approves it when it's ready.
4. **Merged and released** — once approved, the PR is merged and the plugin is released, making it available to all SquaredUp users.

Review changes go on the same branch. A new plugin stays at `<major>.0.0` through every review round; a change needs only one version bump for the whole PR.

Don't push further commits, respond to reviews or close the PR unless the user asks.
