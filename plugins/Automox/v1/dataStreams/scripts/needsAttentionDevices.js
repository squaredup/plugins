// dataStreams/scripts/needsAttentionDevices.js
//
// Optional device-scoped filter, same reasoning as prepatchDevices.js: `id`
// here matches the Devices stream's `deviceId` PROPERTY, not the Device
// object's sourceId (uuid).
const report = Array.isArray(data) ? data[0] : data;
const rows = (report && report.nonCompliant && report.nonCompliant.devices) || [];

const unwrap = (v) => (Array.isArray(v) ? v[0] : v);
const selected = (context.config && context.config.device) || [];
const deviceIds = new Set(selected.map((o) => Number(unwrap(o.deviceId))).filter((n) => !Number.isNaN(n)));

const filtered = deviceIds.size ? rows.filter((r) => deviceIds.has(Number(r.id))) : rows;

// Flatten `policies` while it's still a real parsed array, then leave the raw
// array behind so a large estate's table stays small enough to load.
result = filtered.map((r) => {
    const policies = r.policies || [];
    return {
        id: r.id,
        name: r.name,
        customName: r.customName,
        groupId: r.groupId,
        connected: r.connected,
        needsReboot: r.needsReboot,
        os_family: r.os_family,
        lastRefreshTime: r.lastRefreshTime,
        serverCreateTime: r.serverCreateTime,
        failingPolicyCount: policies.length,
        failingPolicyNames: policies.map((p) => p.name).filter(Boolean).join(", "),
        failingPolicySeverities: [...new Set(policies.map((p) => p.severity).filter(Boolean))].join(", "),
        failingPolicyReasons: policies.map((p) => p.reasonForFail).filter(Boolean).join("; "),
    };
});
