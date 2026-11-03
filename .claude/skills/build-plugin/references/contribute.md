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

    From here on, **`<upstream>`** means the remote whose URL is `squaredup/plugins` itself — never a fork, which can be behind. In a plain clone it is `origin`; after `gh repo fork` it is `upstream` (the fork becomes `origin`). If no remote points at `squaredup/plugins`, add one: `git remote add upstream https://github.com/squaredup/plugins.git`. Re-check `git remote -v` whenever a step below changes the remotes.
4. **New plugin or change?** — `git fetch <upstream> main`, then `git ls-tree -d <upstream>/main plugins/<PluginName>`. Absent on `main` → **new plugin**; present → **change to an existing plugin**. This decides the template (step 5) and the version rule:
    - New plugin: `metadata.json` stays at `<major>.0.0` matching its `v<major>` folder.
    - Change: `version` must be higher than on `main` — invoke `deploy-plugin` for the bump if Phase 9 didn't.
5. **Push access** — `gh repo view squaredup/plugins --json viewerPermission`. `WRITE`, `MAINTAIN` or `ADMIN` → push a branch to `<upstream>` directly. Anything else → push to the user's fork and open the PR from there. If the clone has no fork remote yet, run `gh repo fork --remote` (no repository argument — `gh` rejects `--remote` alongside one) from inside the clone: it creates the fork, renames the existing `origin` to `upstream` and adds the fork as `origin`.

### Without the GitHub CLI

Each `gh` step has a git-and-browser equivalent:

| Step | Instead of `gh` |
| --- | --- |
| Clone (precondition 3) | The user forks at [github.com/squaredup/plugins/fork](https://github.com/squaredup/plugins/fork) (or skips forking if they have write access), then `git clone` that repository. A clone of the fork has no remote for `squaredup/plugins` — add `upstream` as precondition 3 describes |
| Push access (precondition 5) | Push to `origin` in step 6. A `403` or `Permission denied` means no write access: ask the user to fork in the browser, then `git remote add fork https://github.com/<login>/plugins.git` and push there instead |
| Open the PR (step 6) | Give the user a link to the compare page instead of running `gh pr create` — see step 6 |

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
4. **Check history, not just the final files.** Anything committed on the branch is published with it, even if a later commit removed it. If the plugin has commits of its own, run `git log -p <upstream>/main..HEAD -- plugins/<PluginName>` through the same sweep. If a secret appears anywhere in history, don't push that branch — build a fresh branch from `<upstream>/main` with only the clean files (step 4), and tell the user to **rotate the credential** regardless, since it may already exist elsewhere.
5. **Check what else would ship.** The PR must contain the plugin folder plus, optionally, a `.github/CODEOWNERS` line. Personal configuration (`.claude/settings.json`, `*.local.json`, `.env`, scratch test output) must not be staged.

### Resolve with the user

Show every finding to the user — grouped by file, with your suggested replacement — and fix them only with their agreement. Some will be judgement calls (is that hostname the vendor's public API or their private instance?) that only the user can answer. When a value has to be generalised, replace it with a neutral example in the style [REVIEW.md](../../../../REVIEW.md) asks for (e.g. `https://organisation.atlassian.net`, `rootly_xxxxxxxxx`).

After fixing, **re-run `squaredup validate --json`** and redeploy with `deploy-plugin` if anything other than docs changed, so the PR ships what was tested. Re-run the sweep until it comes back clean, then tell the user plainly that it did.

## 4. Branch and commit

1. **Branch from current `main`** — the plugin may sit on a working branch, with uncommitted changes, so bring it across by copying only the folder, never by merging unrelated history:
    1. **Keep a copy** of the whole `plugins/<PluginName>/` folder in your scratch directory.
    2. **Clear the way** — if `git status --porcelain -- plugins/<PluginName>` prints anything, `git stash push --include-untracked -- plugins/<PluginName>` so the switch can't be refused over those paths. Tell the user the stash holds their working state.
    3. **Pick the branch name** — `plugins/<PluginName>`, unless `git rev-parse --verify --quiet refs/heads/plugins/<PluginName>` shows it already exists; then add a suffix such as `-contribution`. `<branch>` below means the name chosen.
    4. **Branch and restore** — `git fetch <upstream> main && git switch -c <branch> <upstream>/main`, then replace the folder with the copy: `rm -rf plugins/<PluginName> && cp -R <scratch>/<PluginName> plugins/`.
2. **CODEOWNERS** — for a new plugin, the README asks contributors to add themselves to [`.github/CODEOWNERS`](../../../../.github/CODEOWNERS) so they review future changes. Ask the user for their GitHub handle (it may differ from `author.name` in `metadata.json`) and add a line in the existing style: `plugins/<PluginName>/ @handle`. Skip it if they decline.
3. **Stage explicitly** — `git add plugins/<PluginName> .github/CODEOWNERS`, never `git add -A`. Then confirm the scope the same way CI does:

    ```bash
    git diff --name-only --cached <upstream>/main | grep -oE 'plugins/[^/]+' | sort -u   # must print exactly one plugin
    git diff --name-only --cached <upstream>/main                                         # nothing outside the plugin folder and CODEOWNERS
    git diff --cached <upstream>/main -- .github/CODEOWNERS                               # only the one owner line added
    ```

    If the `CODEOWNERS` diff shows anything else, the working copy had unrelated edits. Unstage it (`git restore --staged .github/CODEOWNERS`), show the user those edits, and with their agreement set them aside (`git stash push -- .github/CODEOWNERS`) before re-adding just the owner line and staging again.

4. **Commit** with a message in the repository's style — `Add <displayName> plugin` for a new plugin, or a short imperative summary of the change for an existing one.

## 5. Write the PR description from the template

The repository requires the **matching template**, and PRs raised without it may be closed. Read the template file at run time — don't write the body from memory:

- New plugin → `.github/PULL_REQUEST_TEMPLATE/Add a new plugin.md`
- Change to an existing plugin → `.github/PULL_REQUEST_TEMPLATE/Change to an existing plugin.md`

Keep every heading and checklist in the template's order and fill each section from what this build actually produced. Write the body to a file (e.g. in your scratch directory) so it can be shown to the user and passed to `gh`. A few things the template can't tell you:

- **Testing** means what was actually run against the live deployment — the Checkpoint A auth probe, the Checkpoint B import, each stream's PASS report from Phases 5–6, the dashboards rendering. `squaredup validate` is not a test plan.
- **Known limitations** already exist — copy them from the finalised `docs/README.md`.
- **Screenshots** can't be uploaded by `gh` — leave those headings with a note for the user to drag images in on GitHub.
- **Checklist** items are ticked only once verified; "no secrets" is earned by step 3, and the Code of Conduct item only as described below.

Take the HTML comment prompts out once a section is filled. Don't add sections the template doesn't have, and don't put tenant details, internal links or anything step 3 removed back into the description.

### Code of Conduct

The checklist's "I agree to the Code of Conduct" is the user's agreement, so **ask them for it explicitly** — a yes to contributing, or to any earlier question, is not agreement. Link [`CODE_OF_CONDUCT.md`](../../../../CODE_OF_CONDUCT.md) (offer to summarise it if they want), then ask with `AskUserQuestion`:

- `I agree to the Code of Conduct` → tick the box
- `I don't agree` → leave it unticked and stop: the README says contributing means agreeing to it, so don't raise the PR. Tell the user the plugin is still deployed in their tenant.

Tick the box **only** on that explicit `I agree`. Any other answer (including "Other" or a question) is not agreement — answer it and ask again.

**Title**: `Add <displayName> plugin` for a new plugin, matching existing PRs; a short imperative summary for a change.

## 6. Confirm, push and open the PR

Before anything leaves the machine, ask with `AskUserQuestion`: `Open the pull request`, `Open it as a draft`, or `Make changes first`. Only on approval:

```bash
git push -u <remote> <branch>
gh pr create --repo squaredup/plugins --base main \
    --head <head> \
    --title "<title>" --body-file <body-file>
```

Add `--draft` only if the user chose `Open it as a draft`.

`<head>` is just `<branch>` when pushing directly to `squaredup/plugins`, or `<login>:<branch>` when pushing to the user's fork. `gh` doesn't accept an organisation before the colon, so `squaredup:<branch>` fails.

**Without the GitHub CLI**, push with `git` as above, then give the user this link to open the PR in their browser. `<owner>` is `squaredup` for a direct push, or the user's login for a fork (the browser accepts either). URL-encode the title:

```text
https://github.com/squaredup/plugins/compare/main...<owner>:<branch>?expand=1&title=<title>
```

Print the PR description for them to paste into the description box — don't put it in the URL, which is too long for a full template — and tell them to use the arrow next to **Create pull request** if they wanted a draft. Ask them to share the PR URL once it's created.

## 7. Hand over — what happens next

Give the user the PR URL and then show them what happens next, in this order:

1. **Automated checks** — CI checks the PR changes a single plugin with a valid version, validates it, and deploys it to a shared SquaredUp organisation for testing. The results appear as a comment on the PR.
2. **CodeRabbit review** — CodeRabbit automatically reviews the PR and leaves feedback as comments. Address each one by pushing a fix to the same branch or replying to explain why not — they can ask you for help with either.
3. **SquaredUp team review** — a member of the SquaredUp team reviews the plugin against [REVIEW.md](../../../../REVIEW.md), may ask for changes, and approves it when it's ready.
4. **Merged and released** — once approved, the PR is merged and the plugin is released, making it available to all SquaredUp users.

Review changes go on the same branch. A new plugin stays at `<major>.0.0` through every review round; a change needs only one version bump for the whole PR.

Don't push further commits, respond to reviews or close the PR unless the user asks.
