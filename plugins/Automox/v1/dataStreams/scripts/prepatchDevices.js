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

result = deviceIds.size ? rows.filter((r) => deviceIds.has(Number(r.id))) : rows;
