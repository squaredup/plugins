// Rows are keyed by UTC calendar parts; hr and min are omitted by the API when 0,
// and so is any energy field whose value is 0.
const device = context.objects[0];
const prop = (p) => (Array.isArray(p) ? p[0] : p);
const power = context.config?.measure === "power";

const start = new Date(context.timeframe.start).getTime();
const end = new Date(context.timeframe.end).getTime();

// The response is { "U<serial>": [rows] }; take the first array rather than build the key.
const history = Object.values(data || {}).find(Array.isArray) || [];

const rows = history.map((row) => ({ row, time: Date.UTC(row.yr, row.mon - 1, row.dom, row.hr || 0, row.min || 0) }));

// Mirrors the endpoint choice in the stream (minute rows up to 24 hours, else hourly).
const seconds = end - start <= 86400000 ? 60 : 3600;

// Joules per interval -> kWh, or average kW over the interval.
const convert = (joules) => {
    const value = (joules || 0) / (power ? seconds * 1000 : 3600000);
    return Math.round(value * 1e6) / 1e6;
};
const sum = (row, keys) => keys.reduce((total, key) => total + (row[key] || 0), 0);

result = rows
    .filter(({ time }) => time + seconds * 1000 > start && time < end)
    .map(({ row, time }) => ({
        timestamp: new Date(time).toISOString(),
        deviceName: device.name,
        deviceKey: device.rawId,
        deviceType: prop(device.sourceType),
        import: convert(row.imp),
        export: convert(row.exp),
        generation: convert(row.gep),
        diverted: convert(sum(row, ["h1d", "h2d", "h3d"])),
        boosted: convert(sum(row, ["h1b", "h2b", "h3b"])),
        batteryCharge: convert(row.bcp1),
        batteryDischarge: convert(row.bdp1),
        unit: power ? "kW" : "kWh",
    }));
