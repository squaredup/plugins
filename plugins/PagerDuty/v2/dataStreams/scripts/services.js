// Optional `service` object-picker parameter (stream `ui` name "service").
// Selected objects arrive at context.config.service as an ARRAY (multi-select),
// each rawId a single-element array. Empty/absent -> account-wide, no filter.
const unwrap = (v) => (Array.isArray(v) ? v[0] : v);
const selected = (context.config && context.config.service) || [];
const selectedIds = new Set(selected.map((o) => unwrap(o.rawId)).filter(Boolean));

const rows = data.services || [];
const scoped = selectedIds.size ? rows.filter((s) => selectedIds.has(s.id)) : rows;

result = scoped.map((s) => ({
    id: s.id,
    name: s.name,
    status: s.status,
    description: s.description || "",
    escalationPolicyId: s.escalation_policy ? s.escalation_policy.id : "",
    escalationPolicyName: s.escalation_policy ? s.escalation_policy.summary : "",
    teamIds: (s.teams || []).map((t) => t.id).join(","),
    teamNames: (s.teams || []).map((t) => t.summary).join(", "),
    alertCreation: s.alert_creation || "",
    htmlUrl: s.html_url,
}));
