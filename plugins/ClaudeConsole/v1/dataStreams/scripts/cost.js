// cost.js — flatten nested time-bucket/results structure, coerce amount string→number,
// and optionally scope to selected workspace(s) via the `workspace` objects param.

const unwrap = (v) => (Array.isArray(v) ? v[0] : v);

// Build set of selected workspace rawIds (empty → account-wide, no filter)
const selected = (context.config && context.config.workspace) || [];
const workspaceIds = new Set(
    selected.map((o) => unwrap(o.rawId)).filter(Boolean),
);

// Flatten buckets × results into one row per combination
let rows = (data.data || []).flatMap((bucket) =>
    (bucket.results || []).map((r) => ({
        ...r,
        date: bucket.starting_at,
        // API returns `amount` in lowest currency units (cents) as a decimal string,
        // e.g. "300" cents = $3.00 — divide by 100 to get USD. Verified empirically:
        // cost/token matches Claude's published per-model list prices exactly only in cents.
        amount: Number(r.amount) / 100,
        workspace_id: r.workspace_id ?? "default",
        description: r.description,
    })),
);

// Apply optional workspace scope filter
if (workspaceIds.size) {
    rows = rows.filter((r) => workspaceIds.has(r.workspace_id));
}

result = rows;

