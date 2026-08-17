// Optional `user` object-picker parameter (stream `ui` name "user").
// Selected objects arrive at context.config.user as an ARRAY (multi-select),
// each rawId a single-element array. Empty/absent -> account-wide, no filter.
const unwrap = (v) => (Array.isArray(v) ? v[0] : v);
const selected = (context.config && context.config.user) || [];
const selectedIds = new Set(selected.map((o) => unwrap(o.rawId)).filter(Boolean));

const rows = data.users || [];
const scoped = selectedIds.size ? rows.filter((u) => selectedIds.has(u.id)) : rows;

result = scoped.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    jobTitle: u.job_title || "",
    timezone: u.time_zone || "",
    teamIds: (u.teams || []).map((t) => t.id).join(","),
    teamNames: (u.teams || []).map((t) => t.summary).join(", "),
    htmlUrl: u.html_url,
}));
