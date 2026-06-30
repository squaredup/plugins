const unwrap = (v) => (Array.isArray(v) ? v[0] : v);

// Build set of selected workspace rawIds (empty → account-wide, no filter)
const selected = (context.config && context.config.workspace) || [];
const workspaceIds = new Set(
    selected.map((o) => unwrap(o.rawId)).filter(Boolean),
);

let rows = data.data.map((a) => ({
    ...a,
    // Claude does not let us filter by the default workspace on their api.
    workspace_id: a.workspace_id || "default",
}));

// Apply optional workspace scope filter
if (workspaceIds.size) {
    rows = rows.filter((r) => workspaceIds.has(r.workspace_id));
}

result = rows;
