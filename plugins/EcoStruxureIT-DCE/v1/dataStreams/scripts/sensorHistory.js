// /v1/sensors/history returns one entry per sensor with its readings nested in
// timeValuePairs, so flatten to one row per reading.
//
// The API returns every stored reading with no aggregation option. Over long timeframes and
// several sensors that easily exceeds the ~6MB stream response limit, so the output is capped
// at MAX_ROWS in total. Each sensor gets a share of that budget: numeric readings beyond it
// are averaged into equal time buckets, and state readings are reduced to their changes (then
// evenly sampled if there are still too many).
//
// Shared by the sensorHistory stream (scoped to Sensor objects) and the Device-scoped
// environmentalHistory and deviceSensorHistory streams. The Device-scoped ones have no sensor
// IDs to start from, so they run in two steps using nextUrl paging: the first request lists the
// device's sensors, and this script picks out the wanted ones (those matching the sensorName and
// kind parameters, or else the environmental ones) and returns their history URL as the next page.
// The second request is then an ordinary history request. DCE doesn't page either response (each
// is one complete array), so the stream's nextPageUrl path never matches anything and this script's
// pagingContext is the only "next page" there is. Two small calls per device stay well
// inside DCE's rate limit, unlike importing every sensor, which is too slow and too large on big
// installations.
const MAX_ROWS = 20000;

const toIso = (ms) => (typeof ms === "number" && ms > 0 ? new Date(ms).toISOString() : null);

// Keep these lists in step with sensors.js.
const ENVIRONMENTAL_KINDS = new Set([
    "TEMPERATURE", "DIFF_TEMP", "HUMIDITY", "DEW_POINT", "AIRFLOW", "VOL_AIRFLOW", "VOL_AIRFLOW_SEC",
    "DOOR", "RA_DOOR", "RMT_DOOR", "MOTION_SENSOR"
]);
const ENVIRONMENTAL_LABEL = /temperature|humidity|dew point|air ?flow|leak|fluid|water|smoke|door|motion/i;
const POWER_KINDS = new Set([
    "POWER_KVA", "POWER_KWATTS", "K_REACT_POWER", "KVH", "KVA_HOUR", "KWATT_HOUR", "ENERGY_KWH",
    "CURRENT", "AMP_DETECTOR", "POWER_VA", "POWER_WATTS", "VOLTAGE"
]);
const categoryOf = (kind, label, sensorType) => {
    const k = String(kind || "").toUpperCase();
    if (ENVIRONMENTAL_KINDS.has(k) || ENVIRONMENTAL_LABEL.test(label || "")) return "Environmental";
    if (POWER_KINDS.has(k) || String(sensorType || "").startsWith("NUMBER_POWER")) return "Power";
    return "Other";
};

// Names and kinds arrive as [{ value }] from a picker, or as plain strings when typed or set by a
// dashboard. Names are matched whole and ignoring case; they can contain commas ("State, Outlet 1").
// Kinds suit devices whose sensor names vary by model, such as rack PDUs.
const pickedValues = (picked) =>
    new Set(
        (Array.isArray(picked) ? picked : [picked])
            .map((n) => (n && typeof n === "object" ? n.value : n))
            .filter(Boolean)
            .map((n) => String(n).trim().toLowerCase())
    );
const sensorNames = pickedValues((context.config && context.config.sensorName) || []);
const sensorKinds = pickedValues((context.config && context.config.kind) || []);
const isWanted = (s) =>
    sensorNames.size === 0 && sensorKinds.size === 0
        ? categoryOf(s.kind, s.label, s.sensorType) === "Environmental"
        : (sensorNames.size === 0 || sensorNames.has(String(s.label || "").trim().toLowerCase())) &&
          (sensorKinds.size === 0 || sensorKinds.has(String(s.kind || "").toLowerCase()));

// Step one of the Device-scoped streams: the response is a device's sensor list, not history.
const isDeviceSensorList = /[/]devices[/][^/]+[/]sensors$/.test(url.pathname);
let historyUrl;
if (isDeviceSensorList) {
    const guids = (Array.isArray(data) ? data : [])
        .filter((s) => s && s.guid && isWanted(s))
        .map((s) => s.guid);
    if (guids.length > 0) {
        const apiBase = url.origin + url.pathname.replace(/[/]v1[/].*$/, "");
        const query = guids.map((g) => "sensorGuid=" + encodeURIComponent(g)).join("&");
        // Carry the data source's locale over, so the history's labels and units match step one.
        const locale = url.searchParams.get("locale");
        historyUrl =
            `${apiBase}/v1/sensors/history?${query}` +
            `&startTime=${Date.parse(context.timeframe.start)}&endTime=${Date.parse(context.timeframe.end)}` +
            (locale ? `&locale=${encodeURIComponent(locale)}` : "");
    }
}

const sensors = (isDeviceSensorList ? [] : Array.isArray(data) ? data : [])
    .filter(Boolean)
    .map((sensor) => ({
        sensor,
        numeric: String(sensor.sensorType || "").startsWith("NUMBER"),
        pairs: (sensor.timeValuePairs || [])
            .filter((p) => p && typeof p.time === "number")
            .sort((a, b) => a.time - b.time)
    }));

// A relay agent reads the plugin's output in the Windows code page rather than UTF-8, so a
// degree sign arrives as "Â°". Drop it ("°C" becomes "C") until the agent is fixed.
const asciiUnits = (text) => (typeof text === "string" ? text.replace(/°\s?/g, "") : text);

const rowFor = (sensor, time, value, valueText, severityText) => ({
    time: toIso(time),
    value,
    valueText: asciiUnits(valueText),
    severityText,
    // DCE's own wording for badges; history readings often carry only a numeric severity.
    statusText: severityText ? (/^(none|ok|normal)$/i.test(severityText) ? "OK" : severityText) : undefined,
    units: asciiUnits(sensor.units),
    category: categoryOf(sensor.kind, sensor.sensorLabel, sensor.sensorType),
    kind: sensor.kind,
    sensorGuid: sensor.sensorGuid,
    sensorLabel: sensor.sensorLabel,
    deviceGuid: sensor.deviceGuid,
    deviceLabel: sensor.deviceLabel,
    series: sensor.deviceLabel ? `${sensor.deviceLabel} - ${sensor.sensorLabel}` : sensor.sensorLabel
});

// Readings are formatted in the server's locale, so "1.234" may mean 1234 (comma-decimal
// locales) or 1.234. The API doesn't report its locale, so infer the decimal mark from the
// readings that can only be read one way: a separator not followed by exactly three digits,
// one after a leading zero, both separators together, or the same one repeated. Every
// reading in a response shares the server's locale; with no evidence, assume ".".
const numberToken = (text) => {
    const match = String(text ?? "").match(/-?\d[\d.,]*/);
    return match ? match[0].replace(/[.,]$/, "") : null;
};

const unambiguousDecimalMark = (s) => {
    const lastDot = s.lastIndexOf(".");
    const lastComma = s.lastIndexOf(",");
    if (lastDot >= 0 && lastComma >= 0) return lastDot > lastComma ? "." : ",";
    const sep = lastDot >= 0 ? "." : lastComma >= 0 ? "," : null;
    if (!sep) return null;
    if (s.indexOf(sep) !== s.lastIndexOf(sep)) return sep === "." ? "," : ".";
    if (/^-?0[.,]/.test(s) || !new RegExp(`\\${sep}\\d{3}$`).test(s)) return sep;
    return null;
};

const decimalMark = (() => {
    let dot = 0;
    let comma = 0;
    for (const { numeric, pairs } of sensors) {
        if (!numeric) continue;
        for (const p of pairs) {
            const s = numberToken(p.value);
            const mark = s && unambiguousDecimalMark(s);
            if (mark === ".") dot++;
            if (mark === ",") comma++;
        }
    }
    return comma > dot ? "," : ".";
})();

const numberOf = (text) => {
    let s = numberToken(text);
    if (!s) return null;
    const mark = unambiguousDecimalMark(s) || decimalMark;
    s = mark === "," ? s.replace(/\./g, "").replace(",", ".") : s.replace(/,/g, "");
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

// The history URL becomes the next page; leaving it undefined ends the stream (a device with no
// environmental sensors, or the history page itself).
pagingContext = historyUrl;
