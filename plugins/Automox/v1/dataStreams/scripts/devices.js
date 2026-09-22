// dataStreams/scripts/devices.js
//
// policyIds/deviceTags used to be computed via valueExpression referencing
// $['policy_status']/$['tags'], but those columns are shaped "json" - a
// valueExpression reads a column's post-shaping (stringified) value, not the
// live array, so .map() on policy_status threw and tags silently held a
// string instead of an array. Compute both here instead, while they're
// still real parsed arrays.
const rows = Array.isArray(data) ? data : [];

result = rows.map((r) => ({
    ...r,
    policyIds: (r.policy_status || []).map((p) => p.policy_id),
    deviceTags: r.tags || [],
}));
