// Optional `workspaces` object-picker parameter: selected objects arrive at
// context.config.workspaces, each rawId a single-element array. Empty/absent
// (including the import run) returns every workspace. Also flattens the
// disabled server tools list into a comma-separated string for tables.
const unwrap = (v) => (Array.isArray(v) ? v[0] : v);
const selected = context.config?.workspaces ?? [];
const ids = new Set(selected.map((o) => unwrap(o.rawId)).filter(Boolean));

result = (data?.data ?? [])
    .filter((w) => !ids.size || ids.has(w.id))
    .map((w) => ({ ...w, disabled_server_tools: w.disabled_server_tools?.join(', ') || null }));
