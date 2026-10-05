// /v1/sensors/history returns one entry per sensor with its readings nested in
// timeValuePairs, so flatten to one row per reading.
//
// The API returns every stored reading with no aggregation option. Over long timeframes and
// several sensors that easily exceeds the ~6MB stream response limit, so once the row count
// passes MAX_ROWS each sensor's numeric readings are averaged into equal time buckets.
const MAX_ROWS = 20000;

const toIso = (ms) => (typeof ms === "number" && ms > 0 ? new Date(ms).toISOString() : null);

const sensors = (Array.isArray(data) ? data : []).filter(Boolean);
const totalReadings = sensors.reduce((n, s) => n + (s.timeValuePairs || []).length, 0);
const perSensorLimit = Math.max(50, Math.floor(MAX_ROWS / Math.max(1, sensors.length)));

const rowFor = (sensor, time, value, valueText, severityText) => ({
    time: toIso(time),
    value,
    valueText,
    severityText,
    units: sensor.units,
    kind: sensor.kind,
    sensorGuid: sensor.sensorGuid,
    sensorLabel: sensor.sensorLabel,
    deviceGuid: sensor.deviceGuid,
    deviceLabel: sensor.deviceLabel,
    series: sensor.deviceLabel ? `${sensor.deviceLabel} - ${sensor.sensorLabel}` : sensor.sensorLabel
});

// Readings are formatted in the server's locale, so the decimal mark may be "." or ",".
// When both appear, the later one is the decimal mark; a lone comma is a decimal mark unless
// it is followed by exactly three digits (a thousands separator).
const numberOf = (text) => {
    const match = String(text ?? "").match(/-?\d[\d.,]*/);
    if (!match) return null;
    let s = match[0].replace(/[.,]$/, "");
    const lastDot = s.lastIndexOf(".");
    const lastComma = s.lastIndexOf(",");
    if (lastDot >= 0 && lastComma >= 0) {
        s = lastDot > lastComma ? s.replace(/,/g, "") : s.replace(/\./g, "").replace(",", ".");
    } else if (lastComma >= 0) {
        const parts = s.split(",");
        s = parts.length === 2 && parts[1].length !== 3 ? parts.join(".") : parts.join("");
    }
    const n = parseFloat(s);
    return Number.isNaN(n) ? null : n;
};

result = sensors.flatMap((sensor) => {
    const pairs = (sensor.timeValuePairs || [])
        .filter((p) => p && typeof p.time === "number")
        .sort((a, b) => a.time - b.time);
    const numeric = String(sensor.sensorType || "").startsWith("NUMBER");

    if (totalReadings <= MAX_ROWS || pairs.length <= perSensorLimit || !numeric) {
        return pairs.map((p) =>
            rowFor(sensor, p.time, numeric ? numberOf(p.value) : null, p.value, p.severityText)
        );
    }

    const start = pairs[0].time;
    const span = Math.max(1, pairs[pairs.length - 1].time - start);
    const bucketMs = Math.ceil(span / perSensorLimit);
    const buckets = new Map();
    for (const p of pairs) {
        const value = numberOf(p.value);
        if (value === null) continue;
        const key = Math.floor((p.time - start) / bucketMs);
        const bucket = buckets.get(key) || { sum: 0, count: 0, last: p };
        bucket.sum += value;
        bucket.count += 1;
        bucket.last = p;
        buckets.set(key, bucket);
    }
    return [...buckets.entries()].map(([key, b]) => {
        const avg = b.sum / b.count;
        return rowFor(sensor, start + key * bucketMs, avg, avg.toFixed(2), b.last.severityText);
    });
});
