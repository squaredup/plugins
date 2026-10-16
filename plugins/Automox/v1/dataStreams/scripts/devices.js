// dataStreams/scripts/devices.js
//
// policyIds/deviceTags/deviceStatus used to be computed via valueExpression
// referencing $['policy_status']/$['tags']/$['status'], but those columns
// are shaped "json" - a valueExpression reads a column's post-shaping
// (stringified) value, not the live object, so .map() on policy_status
// threw and tags silently held a string instead of an array. Compute all
// three here instead, while they're still real parsed values.
//
// Import pages this stream at up to 500 devices/page; keeping the raw
// status/tags/policy_status blobs on every row (via a full `...r` spread)
// pushed a page over the ~6MB import response cap on large estates - see
// index-defs.md#large-imports-choosing-pagesize. Drop them once the
// derived fields are computed instead of carrying them forward unused.
const rows = Array.isArray(data) ? data : [];

result = rows.map((r) => {
    const { status, tags, policy_status, ...lean } = r;

    return {
        ...lean,
        deviceStatus: (status || {}).device_status,
        policyIds: (policy_status || []).map((p) => p.policy_id),
        deviceTags: tags || [],
    };
});
