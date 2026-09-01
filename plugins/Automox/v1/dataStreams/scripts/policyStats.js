// dataStreams/scripts/policyStats.js
//
// Optional policy-scoped filter: when the tile's "policy" objects picker has
// a selection, narrow to those policies only. Policy's sourceId is the raw
// `id`, so the picker's rawId matches `policy_id` directly - no property
// lookup needed here (unlike the device-scoped report streams).
const rows = data || [];

const unwrap = (v) => (Array.isArray(v) ? v[0] : v);
const selected = (context.config && context.config.policy) || [];
const policyIds = new Set(selected.map((o) => Number(unwrap(o.rawId))).filter((n) => !Number.isNaN(n)));

result = policyIds.size ? rows.filter((r) => policyIds.has(Number(r.policy_id))) : rows;
