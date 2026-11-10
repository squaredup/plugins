// dataStreams/scripts/prepatchDevices.js
//
// Optional device-scoped filter: when the tile's "device" objects picker has
// a selection, narrow to just that device's row(s). This report's `id` is
// the integer device id, which matches the Devices stream's `deviceId`
// PROPERTY - not the Device object's sourceId (uuid) - so this compares
// against each selected object's own indexed `deviceId` property rather than
// its rawId.
const rows = (data && data.prepatch && data.prepatch.devices) || [];

const unwrap = (v) => (Array.isArray(v) ? v[0] : v);
const selected = (context.config && context.config.device) || [];
const deviceIds = new Set(selected.map((o) => Number(unwrap(o.deviceId))).filter((n) => !Number.isNaN(n)));

const filtered = deviceIds.size ? rows.filter((r) => deviceIds.has(Number(r.id))) : rows;

// Flatten `patches` while it's still a real parsed array, then leave the raw
// array behind: one entry per pending patch per device is most of this
// report's size, and carrying it on every row stops a large estate's table
// from loading.
result = filtered.map((r) => {
    const patches = r.patches || [];
    return {
        id: r.id,
        name: r.name,
        createTime: r.createTime,
        group: r.group,
        compliant: r.compliant,
        connected: r.connected,
        needsReboot: r.needsReboot,
        os_family: r.os_family,
        patchCount: patches.length,
        patchNames: patches.map((p) => p.name).filter(Boolean).join(", "),
        patchSeverities: [...new Set(patches.map((p) => p.severity).filter(Boolean))].join(", "),
    };
});
