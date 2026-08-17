// Optional `user` object-picker parameter (stream `ui` name "user").
// PagerDuty's GET /notifications endpoint has no server-side user filter,
// so scoping is done client-side here. Selected objects arrive at
// context.config.user as an ARRAY (multi-select), each rawId a single-element
// array. Empty/absent -> account-wide, no filter.
const unwrap = (v) => (Array.isArray(v) ? v[0] : v);
const selected = (context.config && context.config.user) || [];
const selectedIds = new Set(selected.map((o) => unwrap(o.rawId)).filter(Boolean));

const rows = data.notifications || [];
const scoped = selectedIds.size ? rows.filter((n) => n.user && selectedIds.has(n.user.id)) : rows;

result = scoped.map((n) => ({
    id: n.id,
    type: n.type,
    address: n.address || "",
    "user.id": n.user ? n.user.id : "",
    "user.summary": n.user ? n.user.summary : "",
    started_at: n.started_at,
}));
