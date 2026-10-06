// /v1/sensors/history returns one entry per sensor with its readings nested in
// timeValuePairs, so flatten to one row per reading.
//
// The API returns every stored reading with no aggregation option. Over long timeframes and
// several sensors that easily exceeds the ~6MB stream response limit, so the output is capped
// at MAX_ROWS in total. Each sensor gets a share of that budget: numeric readings beyond it
// are averaged into equal time buckets, and state readings are reduced to their changes (then
// evenly sampled if there are still too many).
const MAX_ROWS = 20000;

const toIso = (ms) => (typeof ms === "number" && ms > 0 ? new Date(ms).toISOString() : null);

const sensors = (Array.isArray(data) ? data : [])
    .filter(Boolean)
    .map((sensor) => ({
        sensor,
        numeric: String(sensor.sensorType || "").startsWith("NUMBER"),
        pairs: (sensor.timeValuePairs || [])
            .filter((p) => p && typeof p.time === "number")
            .sort((a, b) => a.time - b.time)
    }));

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

// Picks `limit` evenly spaced items, always keeping the first and last.
const evenlySample = (items, limit) => {
    if (items.length <= limit) return items;
    if (limit <= 1) return items.slice(-limit);
    const step = (items.length - 1) / (limit - 1);
    return Array.from({ length: limit }, (_, i) => items[Math.round(i * step)]);
};

const averageIntoBuckets = ({ sensor, pairs }, limit) => {
    const start = pairs[0].time;
    const span = Math.max(1, pairs[pairs.length - 1].time - start);
    const bucketMs = span / limit;
    const buckets = new Map();
    for (const p of pairs) {
        const value = numberOf(p.value);
        if (value === null) continue;
        // The last reading sits exactly on the end of the span, so clamp it into the final
        // bucket rather than opening one more than the limit allows.
        const key = Math.min(limit - 1, Math.floor((p.time - start) / bucketMs));
        const bucket = buckets.get(key) || { sum: 0, count: 0, last: p };
        bucket.sum += value;
        bucket.count += 1;
        bucket.last = p;
        buckets.set(key, bucket);
    }
    return [...buckets.entries()].map(([key, b]) => {
        const avg = b.sum / b.count;
        return rowFor(sensor, Math.round(start + key * bucketMs), avg, avg.toFixed(2), b.last.severityText);
    });
};

const sampleStates = ({ sensor, pairs }, limit) => {
    // Keep the last reading too, so the chart runs to the end of the timeframe rather than
    // stopping at the most recent change.
    const changes = pairs.filter(
        (p, i) =>
            i === 0 ||
            i === pairs.length - 1 ||
            p.value !== pairs[i - 1].value ||
            p.severityText !== pairs[i - 1].severityText
    );
    return evenlySample(changes, limit).map((p) => rowFor(sensor, p.time, null, p.value, p.severityText));
};

// Share the budget smallest-first, so sensors needing fewer rows than an equal share hand
// their unused allowance on to the larger ones. The total can never exceed MAX_ROWS.
let remaining = MAX_ROWS;
const rowsBySensor = new Map();
[...sensors]
    .sort((a, b) => a.pairs.length - b.pairs.length)
    .forEach((entry, i, ordered) => {
        const limit = Math.floor(remaining / (ordered.length - i));
        let rows;
        if (limit <= 0 || entry.pairs.length === 0) {
            rows = [];
        } else if (entry.pairs.length <= limit) {
            rows = entry.pairs.map((p) =>
                rowFor(entry.sensor, p.time, entry.numeric ? numberOf(p.value) : null, p.value, p.severityText)
            );
        } else {
            rows = entry.numeric ? averageIntoBuckets(entry, limit) : sampleStates(entry, limit);
        }
        remaining -= rows.length;
        rowsBySensor.set(entry, rows);
    });

result = sensors.flatMap((entry) => rowsBySensor.get(entry));
