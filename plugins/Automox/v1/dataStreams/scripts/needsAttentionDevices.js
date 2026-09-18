// dataStreams/scripts/needsAttentionDevices.js
//
// Optional device-scoped filter, same reasoning as prepatchDevices.js: `id`
// here matches the Devices stream's `deviceId` PROPERTY, not the Device
// object's sourceId (uuid).
const rows = (data && data.nonCompliant && data.nonCompliant.devices) || [];

const unwrap = (v) => (Array.isArray(v) ? v[0] : v);
const selected = (context.config && context.config.device) || [];
const deviceIds = new Set(selected.map((o) => Number(unwrap(o.deviceId))).filter((n) => !Number.isNaN(n)));

const filtered = deviceIds.size ? rows.filter((r) => deviceIds.has(Number(r.id))) : rows;

// Flatten `policies` here, while it's still a real parsed array - a
// valueExpression referencing this column elsewhere would only see its
// JSON-formatted (stringified) display value, not the live array.
result = filtered.map((r) => {
    const policies = r.policies || [];
    return {
        ...r,
        failingPolicyCount: policies.length,
        failingPolicyNames: policies.map((p) => p.name).filter(Boolean).join(", "),
        failingPolicySeverities: [...new Set(policies.map((p) => p.severity).filter(Boolean))].join(", "),
        failingPolicyReasons: policies.map((p) => p.reasonForFail).filter(Boolean).join("; "),
    };
});
