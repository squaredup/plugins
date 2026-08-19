# correlationRules/ Reference — relationships between imported objects

Import definitions create **objects** (graph vertices). Nothing in `indexDefinitions/*.json` creates a **relationship** between them. Relationships come from correlation rules: one JSON file per rule in `v1/correlationRules/`, each describing "when this property on object A equals that property on object B, draw an edge".

Edges are what make a Pod appear under its Node, a device under its site, an alert under the resource that raised it — they drive the object drilldown graph, perspective scoping, and relationship-aware tiles.

---

## File layout

```text
my-plugin/
  v1/
    correlationRules/
      relate-device-to-site.json
      relate-alert-to-device.json
```

- **The filename (minus `.json`) is the `ruleName`** — the stable identifier used to match rules across plugin upgrades. Same filename on the next deploy = the rule is updated in place; a filename that disappears = the rule (and its edges) is removed. **Renaming a file deletes the old rule and creates a new one**, so keep filenames stable once shipped.
- Rules deploy automatically with the plugin — the CLI zips the whole plugin folder, and `squaredup validate` reports `Correlation Rules: N` in its summary.
- One rule per file. There is no index or manifest to register them in.

---

## What you write vs what the platform stamps

Write only the rule's *shape*. These fields are filled in for you and **must not** appear in the file:

| Field                                | Filled in by                                                       |
| ------------------------------------ | ------------------------------------------------------------------ |
| `ruleName`                            | the filename                                                        |
| `ruleType`                            | inferred from the file's shape at install — never write it           |
| `schemaVersion`                       | always `2`                                                          |
| `id`, condition `id`s                 | positional (`"1"`, `"2"`, … in array order) — referenced by `conditionLogic` |
| `pluginId` (rule, source, target, bridge) | deploy time — scoped to this plugin                             |
| `origin`, `edgeSource`, `configs`     | deploy time                                                         |

One consequence worth knowing: **a plugin rule can only relate object types from its own plugin.** Cross-plugin correlation exists, but only as a user-authored rule in Settings → Correlation Rules — a plugin can't ship one.

---

## The four shapes

Write the shape you want; the platform works out the rule type on install. Each shape is recognised purely from the fields present in the file, so there is nothing to declare:

| Shape      | What it does                                                              | Recognised by                              |
| ---------- | ------------------------------------------------------------------------- | ------------------------------------------ |
| **Relate** | Draws a labelled edge between two object types                            | the default — no `bridge`, no `objectGroup` |
| **Bridge** | Relates source to target *through* a third, joining object type           | a `bridge` leg is present                   |
| **Group**  | Buckets source objects under a synthesised grouping object                | `target` is an `objectGroup`                 |
| **Merge**  | Collapses the two objects into one, instead of relating them              | `labels.forward` is exactly `"is"`           |

The platform has two further rule types — **semantic** (fuzzy name matching) and **direct** (one specific object to one other) — that a plugin **cannot** ship; they only exist as user-authored rules. Writing `semanticThreshold` into a file doesn't produce a semantic rule, it produces a Relate rule with no conditions, which fails validation.

---

## Relate — the default shape (95% of what you'll write)

```json
{
    "displayName": "Node runs Pod",
    "source": {
        "types": "Pod"
    },
    "target": {
        "types": "Node"
    },
    "conditions": [
        {
            "sourceProperty": "nodeName",
            "operator": "equals",
            "targetProperty": "name"
        }
    ],
    "labels": {
        "forward": "scheduled on",
        "reverse": "hosts"
    }
}
```

- **`displayName`** (required, ≤256 chars) — how the rule reads in Settings → Correlation Rules. Name the *relationship*, source-first: "Node runs Pod", "Device reports to Site".
- **`source.types` / `target.types`** (required) — a `sourceType` string, or an array of them (max 25, each ≤128 chars). **Must exactly match `objectTypes` entries in `metadata.json`.** The wildcard `"*"` is rejected on both sides.
- **`conditions`** (required, 1–25) — each needs `sourceProperty`, `targetProperty`, and `"operator": "equals"`. `equals` is the only operator, and it is **not** optional — omitting it fails validation.
- **`labels.forward`** (required, ≤128 chars) — reads source → target. Above: "Pod *scheduled on* Node".
- **`labels.reverse`** (optional, ≤128 chars) — reads target → source: "Node *hosts* Pod". Defaults to the forward label when omitted, which reads badly in one direction — always supply it.

Never set `pluginId` or `configs` on `source`/`target`/`bridge`. They're stamped at deploy, and supplying both `pluginId` and `configs` on one leg is a validation error.

### Which side is "source"?

The side that **carries the foreign key**. In the example the Pod holds `nodeName`, so Pod is the source and Node the target. Getting this backwards still produces edges (matching is symmetric) but the labels read the wrong way round.

### Multiple conditions

Multiple conditions are **AND-ed by default** — use this whenever a single key isn't unique (a name that's only unique within a namespace, a device id that repeats per site):

```json
"conditions": [
    { "sourceProperty": "selectorAppLabel", "operator": "equals", "targetProperty": "appLabel" },
    { "sourceProperty": "namespace", "operator": "equals", "targetProperty": "namespace" }
]
```

For anything other than AND-of-all, add `conditionLogic` — a boolean expression over **1-based positional indexes** into the `conditions` array, using only `AND`, `OR`, and parentheses (max nesting depth 5, ≤256 chars):

```json
"conditionLogic": "(1 OR 2) AND 3"
```

A condition the logic never references is silently never evaluated, so keep the two in sync.

### Format expressions

When the two properties hold the same identity in different shapes, transform one side with `sourceExpression` / `targetExpression` — a `{{ }}` template running full JavaScript over `value` (the same expression engine as tiles), ≤512 chars, and it **must** contain a `{{ }}` block:

```json
{
    "sourceProperty": "resourceUri",
    "sourceExpression": "{{ value.split('/').pop() }}",
    "operator": "equals",
    "targetProperty": "rawId"
}
```

Common shapes: `{{ value.toLowerCase() }}` (matching is case-**sensitive**), `{{ value.split(':')[1] }}`, `{{ 'prefix-' + value }}`.

Prefer mapping a clean join key in the import over an expression — an expression runs per candidate vertex on every correlation run.

---

## Bridge — matching through a join object

When source and target share no property, but a third imported object joins them (a membership, an assignment, a mapping row), add a `bridge` leg. Its presence is what makes it a Bridge rule:

```json
{
    "displayName": "Member belongs to Team",
    "source": { "types": "Member" },
    "bridge": { "types": "Team Membership" },
    "target": { "types": "Team" },
    "sourceConditions": [
        { "sourceProperty": "rawId", "operator": "equals", "targetProperty": "memberId" }
    ],
    "targetConditions": [
        { "sourceProperty": "teamId", "operator": "equals", "targetProperty": "rawId" }
    ],
    "labels": { "forward": "member of", "reverse": "has member" }
}
```

- **`sourceConditions`** (required, 1–25) compare **source → bridge**: `sourceProperty` reads the source object, `targetProperty` reads the bridge object.
- **`targetConditions`** (required, 1–25) compare **bridge → target**: `sourceProperty` reads the **bridge**, `targetProperty` reads the target.
- **`conditions`** (optional) compare source → target directly, as an extra filter.
- All three arrays are AND-ed. `conditionLogic` does not apply to Bridge rules.
- The edge is written **source → target**; the bridge object isn't part of it.
- A Bridge rule cannot use the `"is"` label — see the Merge section below.

Only reach for a bridge when the join object genuinely exists as an imported type. If the join is just an array of ids on one side, a plain Relate rule matching an array property is simpler (arrays match if *any* element matches).

---

## Group — synthesising a grouping object

A Group rule buckets source objects by a property value and creates a **synthetic group object per distinct value** — useful when the API exposes a grouping dimension (region, environment, team, tag) that has no object of its own to import. The `target` is an `objectGroup` instead of types:

```json
{
    "displayName": "Device by Region",
    "source": { "types": "Device" },
    "target": {
        "objectGroup": {
            "property": "region",
            "sourceType": "Region"
        }
    },
    "conditions": [
        { "sourceProperty": "region", "operator": "equals", "targetProperty": "*" }
    ],
    "labels": { "forward": "in", "reverse": "contains" }
}
```

- `objectGroup.property` — the source property to bucket on (≤128 chars, cannot be `id`).
- `objectGroup.sourceType` — the type name given to the synthesised group objects. They're named after the property value and owned by the correlation engine, not by an import step.
- Group rules carry exactly **one** condition, whose `targetProperty` is the wildcard `"*"` (the only place the wildcard is legal). A `sourceExpression` on that condition still applies, so you can normalise the bucket key.

Prefer importing a real object type when the API has a list endpoint for it — a real object carries properties and can be a dashboard scope. Reach for a Group rule only when there's nothing to import.

---

## Merge — rarely right for a plugin

A forward label of exactly `"is"` is **canonical**: instead of drawing a relationship, it merges the two objects into a single object in the graph. It exists to reconcile the same real-world thing seen by two different data sources — which a plugin rule can't do, because both legs are scoped to this plugin. Don't ship `"is"` unless you're deliberately deduplicating two object types within your own plugin, and never on a Bridge rule (rejected at validation).

---

## Which properties can be matched — the #1 authoring trap

A condition can only reference a property that actually exists on the **graph vertex**. That means:

| Available on every object                    | Notes                                                          |
| --------------------------------------------- | -------------------------------------------------------------- |
| `name`                                        | from `objectMapping.name`                                       |
| `rawId`                                       | the raw value of `objectMapping.id`, unprefixed                 |
| `sourceType`                                  | the object type                                                 |
| anything in `objectMapping.properties`        | **only** what you explicitly mapped                             |

A column your data stream returns but the import step doesn't map into `properties` **does not exist on the object** and will never match. So the join keys a correlation rule needs must be planned as mapped properties in Phase 2 and mapped in Phase 5 — that's why the Kubernetes plugin maps `ownerUid`, `nodeName`, and `namespace` even though no tile shows them.

Matching semantics:

- **Exact, case-sensitive string equality** after stringification — numbers and booleans are compared as their string form. Use `{{ value.toLowerCase() }}` when the two sides differ in case, and `{{ value.trim() }}` if one side may carry stray whitespace.
- **Array-valued properties match if any element matches** — a `tags` or `memberIds` array on either side works.
- A missing/empty value on either side never matches (it does not match another missing value).

---

## Limits

| Thing                                    | Limit                        |
| ----------------------------------------- | ---------------------------- |
| `types` per leg                           | 25 (each ≤128 chars)         |
| conditions per array                      | 25                           |
| `displayName`                             | 256 chars                    |
| labels                                    | 128 chars each               |
| property names                            | 128 chars                    |
| format expressions                        | 512 chars                    |
| `conditionLogic`                          | 256 chars, nesting depth 5   |

---

## Validation

`squaredup validate --json` from the plugin dir validates every rule against the same schema the platform uses, and the summary reports `Correlation Rules: N`. **Check that count matches the number of files you wrote** — and treat any correlation error as blocking, since an invalid rule fails the whole plugin validation. Errors are reported per file as `<field>: <message>`, e.g. `conditions[0].operator: Condition operator must be "equals"`.

---

## Lifecycle — when edges actually appear

1. **Deploy** — rules ship with the plugin and are stored against the plugin id.
2. **Data source** — each authenticated instance of the plugin gets a read-only copy, visible in Settings → Correlation Rules under the data source rules tab.
3. **Evaluation** — correlation runs automatically, fire-and-forget, **after each successful import** for that data source. It is not part of the import's success status, so edges appear shortly *after* `index-status` reports done.

So the sequence to see edges is always: deploy the rules → run an import → wait a moment. A rule added after the last import produces nothing until the next import completes.

A rule added after the last import can also be evaluated on demand — see the iteration loop below — which is what makes authoring rules bearable: you do not need a fresh import for every fix.

---

## Verifying and iterating with the CLI

Three commands cover the whole loop. All take `--json`, and `--datasource-id` makes them folder-independent.

| Command | Answers |
| --- | --- |
| `squaredup correlate-status --datasource-id <id> --json` | Which rules are installed for this data source, and what did each last run do? |
| `squaredup edges --datasource-id <id> --plugin-id <pluginId> --json` | Which edges exist on this data source's objects? `--rule <ruleName>` narrows to one rule; `--object <nodeId>` to one object. |
| `squaredup correlate --datasource-id <id> --json` | Re-run the rules now and wait. `--rule <ruleName>` runs one. **Tenant admin only.** |

**Confirming the rules installed.** `correlate-status` lists one entry per rule the data source has, keyed by `ruleName` — the filename you chose. Compare that list against your `correlationRules/` directory: a file that isn't listed never installed, which usually means the deploy that shipped it hasn't landed. This is a stronger check than `validate`, which only proves the file parses.

```jsonc
{
  "done": true,
  "succeeded": true,
  "rules": [
    { "ruleName": "relate-pod-to-node", "status": "succeeded", "edgesCreated": 42, "verticesProcessed": 50 },
    { "ruleName": "relate-pod-to-namespace", "status": "succeeded", "edgesCreated": 0, "verticesProcessed": 50 }
  ]
}
```

Read it per rule, not just the top-level flags. `succeeded: true` means every rule *ran*, not that any of them matched: `relate-pod-to-namespace` above ran cleanly and produced nothing, which is a rule bug. `edgesCreated: 0` alongside a healthy `verticesProcessed` is the classic signature of a join key that doesn't match — take that rule to the common-mistakes table below.

**The iteration loop.** Correlation normally only runs after an import, but `correlate` re-runs it on demand, so fixing a rule costs a redeploy rather than a full re-index:

1. Fix the rule file.
2. Redeploy (invoke `deploy-plugin`) — rules ship with the plugin, so the fix isn't live until it lands.
3. `squaredup correlate --datasource-id <id> --rule <ruleName> --json` — re-runs just that rule and waits for it, reporting `edgesCreated`.
4. `squaredup edges --datasource-id <id> --plugin-id <pluginId> --rule <ruleName> --json` — look at the edges themselves, not just the count.

Only step 2 is slow. **This loop does not need a re-index**: the objects are already in the graph, and correlation re-reads them. You only need a fresh import when you changed `objectMapping.properties` to add a join key — the [re-indexing rule](../SKILL.md#re-indexing-rule) applies then, because existing objects lack the new property.

**Reading `edges`.** Each edge names both ends, so you can see whether the rule joined what you intended and in which direction:

```jsonc
{ "source": { "id": "node-...", "name": "web-01", "sourceType": "Pod" },
  "target": { "id": "node-...", "name": "ip-10-0-1-4", "sourceType": "Node" },
  "label": "runs on", "reverseLabel": "hosts", "origin": "plugin", "configId": "config-..." }
```

- Endpoints reading backwards means source and target are swapped in the rule.
- An empty list while `correlate-status` reports `edgesCreated > 0` for that rule means the two are looking at different things — most often a `--datasource-id` that isn't the one the rule is scoped to, or a `truncated: true` result you read past.
- `origin: "plugin"` confirms the edge came from a plugin rule rather than a user-authored or platform one.

**If you aren't a tenant admin**, `correlate` returns "requires a tenant admin". `correlate-status` and `edges` still work, so you can confirm everything — you just have to trigger a fresh import (Checkpoint B) to re-run rules instead of calling `correlate`.

---

## Common mistakes

| Mistake                                                      | Symptom / fix                                                                                     |
| ------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| Join key not in `objectMapping.properties`                    | `correlate-status` shows the rule ran with `edgesCreated: 0`. Map the property, then **re-index** — existing objects are stale. |
| Rule written but no import run since                          | The rule is absent from `correlate-status`, or present with `status: "notRun"`. Redeploy, then `squaredup correlate` (admin) or run an import. |
| `types` doesn't match `objectTypes` exactly                   | Zero edges, no error. Copy the string from `metadata.json`.                                          |
| `operator` omitted                                            | Validation failure — `equals` is required on every condition.                                        |
| `reverse` label omitted                                       | The relationship reads identically in both directions. Always write both.                            |
| Source/target swapped                                         | Edges exist but read backwards. Source is the side holding the foreign key.                          |
| Renaming a rule file to "tidy up"                             | Old rule and all its edges deleted, new rule recreated. Keep filenames stable.                       |
| `pluginId` / `configs` written into the file                  | Redundant at best; both on one leg is a validation error. Leave scoping to deploy.                   |
| Expecting to correlate to another plugin's objects            | Not possible from a plugin rule — both legs are scoped to this plugin.                               |
| One rule per object-type *pair* when a `types` array would do | Use an array: one Namespace→(Pod, Deployment, Service…) rule beats eight near-identical files.       |
