// dataStreams/scripts/needsAttentionDevices.js
//
// Optional device-scoped filter, same reasoning as prepatchDevices.js: `id`
// here matches the Devices stream's `id` PROPERTY, not the Device object's
// sourceId (uuid).
const rows = (data && data.nonCompliant && data.nonCompliant.devices) || [];

const unwrap = (v) => (Array.isArray(v) ? v[0] : v);
const selected = (context.config && context.config.device) || [];
const deviceIds = new Set(selected.map((o) => Number(unwrap(o.id))).filter((n) => !Number.isNaN(n)));

result = deviceIds.size ? rows.filter((r) => deviceIds.has(Number(r.id))) : rows;
