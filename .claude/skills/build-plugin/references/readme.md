# docs/README.md — the in-product documentation

`docs/README.md` is rendered **in-product** (as GitHub-flavored Markdown) when a user adds or configures the plugin, and the `documentation` link in `metadata.json` must point to it. The reader has never seen the vendor's API and is sitting on the config screen with empty fields in front of them — write every section for that person.

## Two-pass authoring

The README is written twice:

- **Phase 3 (draft)** — write the overview paragraph, **Setup**, and **Configuration fields** in full; the Phase 2 plan has everything they need. Create the remaining four sections as headings with a `<!-- finalized in Phase 9 -->` placeholder — their real content (which streams shipped, what testing revealed) doesn't exist yet, and guessing it now means shipping stale guesses later.
- **Phase 9 (finalize, before the final deploy)** — complete **What this plugin monitors**, **Data streams**, **What gets indexed**, and **Known limitations**, then run the [completion checklist](#completion-checklist-phase-9). Source **Known limitations** from the reconciliation passes' API-level discoveries: every constraint that forced a fix in Phases 5–6 — a restricted `timeframes`, a response-size cap, an import count cap, a rate limit, an auth quirk — belongs here in user-facing words. If it surprised a testing sub-agent, it will surprise a user.

## Structure

**No H1** — the product shows the plugin name above the rendered doc; open directly with the overview paragraph. All sections are required, in this order:

```markdown
<Overview: 1–3 sentences — what the plugin monitors, via which vendor API(s),
linking the product and the API docs.>

> ⚠️ <Optional: scope warning — editions/tiers/APIs the plugin does NOT
> cover. Omit the blockquote entirely if there's nothing to warn about.>

## Setup

<Numbered walkthrough from signing in to the vendor to pasting the credential
into the named config field. State required roles/scopes/permissions at the
step where the user grants them. Link every vendor page a step mentions.>

## Configuration fields

| Field | What it is | Where to find it | Required |
| ----- | ---------- | ---------------- | -------- |

<One row per ui.json field, bold field name matching its label exactly. After
the table: one sentence on what happens on save (the configValidation call)
and what a failure means.>

## What this plugin monitors

<Bullets grouping the data the way a user thinks about it, not the way the
API organizes it. Close with one line naming the out-of-the-box dashboards.>

## Data streams

<One bullet per stream: **displayName** — what it returns and its scope
(per-object or account-wide).>

## What gets indexed

| Object type | API source | Represents |
| ----------- | ---------- | ---------- |

<One row per objectType. Follow with a **Relationships:** line if objects
link to each other.>

## Known limitations

<Bullets: granularity/timeframe caps, rate limits, import count caps, data
freshness, permission constraints, and a read-only note if the plugin never
writes to the vendor.>
```

## Writing rules

- **Name the vendor's UI surfaces, not its endpoints** — "Console → Settings → API keys", not `GET /v1/keys`. Endpoints appear only in the **What gets indexed** API-source column.
- **Bold every field label and vendor UI element** the user must click or fill, matching its on-screen wording exactly.
- **Plain GFM only** — pipe tables, and blockquotes (`> ⚠️ …`) for admonitions. Never GitHub `[!NOTE]`/`[!WARNING]` alert syntax: the in-product renderer isn't GitHub and won't style it.
- **Link out** to the vendor's sign-in page, credential-creation page, and permission docs wherever Setup mentions them — the reader shouldn't need to search for any page a step names.

## Example

A finished README for the fictional battery-monitoring plugin from SKILL.md's Phase 2 example:

```markdown
Monitor your [Acme Energy](https://acme.example) installations and devices in
SquaredUp — battery health, telemetry history, alarms, and billing — via the
[Acme Cloud API](https://acme.example/docs/api).

> ⚠️ Requires an Acme **Business** subscription — Home accounts have no API
> access.

## Setup

You will need an Acme Cloud **API key**.

1. Sign in to the [Acme Cloud console](https://cloud.acme.example).
2. Go to **Settings → API keys** and click **Create key**, giving it the
   **Read-only** role — the plugin never writes.
3. Copy the key and paste it into the **API key** field.

## Configuration fields

| Field       | What it is                                              | Where to find it                              | Required |
| ----------- | ------------------------------------------------------- | --------------------------------------------- | -------- |
| **API key** | Authenticates every request via the `X-API-Key` header. | Acme Cloud console → **Settings → API keys**. | Yes      |

On save, the plugin validates the key by fetching your account profile; an
invalid or expired key fails setup with an authentication error.

## What this plugin monitors

- **Battery health** — current charge, capacity, and cycle count per device.
- **Telemetry history** — hourly charge and temperature series per device.
- **Alarms and billing** — active alarms and daily billed cost per
  installation.

The out-of-the-box dashboards include an estate-wide **Overview** plus a
perspective for each **Installation** and **Device**.

## Data streams

- **Battery Summary** — current battery state, one row per device.
- **Battery History** — hourly charge/temperature time series for a device.
- **Site Alarms** — active alarms for an installation.
- **Site Billing** — daily billed cost for an installation.

## What gets indexed

| Object type      | API source              | Represents                             |
| ---------------- | ----------------------- | -------------------------------------- |
| **Installation** | `GET /v2/installations` | A monitored site.                      |
| **Device**       | `GET /v2/devices`       | A physical device reporting telemetry. |

**Relationships:** each Device links to its parent Installation.

## Known limitations

- **Billing is daily-granularity** — billing timeframes start at last 7
  days; shorter ranges aren't offered.
- **Rate limit** — the API allows 120 requests/minute; very large estates
  may import slowly.
- **Read-only** — the plugin never creates, modifies, or deletes anything in
  Acme Cloud.
```

## Completion checklist (Phase 9)

Verify each line against the plugin's actual files, not from memory:

- [ ] Every field in `ui.json` has a row in **Configuration fields**, bold name matching its label exactly.
- [ ] Every `objectType` in `metadata.json` has a row in **What gets indexed**.
- [ ] Every stream in `dataStreams/*.json` has a bullet in **Data streams**, named by its `displayName`.
- [ ] Every constraint that forced a Phase 5–6 fix (restricted `timeframes`, payload caps, import caps, rate limits) appears in **Known limitations** in user-facing words.
- [ ] No `<!-- finalized in Phase 9 -->` placeholders remain.
