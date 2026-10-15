// /v1/devices/sensors returns every sensor the user can see in one call. Filtering by device
// and kind happens here rather than per-device (/v1/devices/{guid}/sensors) because the API
// allows only 5 requests per minute per service, so a request per device would be throttled.
const unwrap = (v) => (Array.isArray(v) ? v[0] : v);

const selectedDevices = (context.config && context.config.device) || [];
const deviceIds = new Set(selectedDevices.map((o) => unwrap(o.rawId)).filter(Boolean));

// autocomplete values arrive as [{ value }], custom values may arrive as plain strings.
const selectedKinds = (context.config && context.config.kind) || [];
const kinds = new Set(
    (Array.isArray(selectedKinds) ? selectedKinds : [selectedKinds])
        .map((k) => (k && typeof k === "object" ? k.value : k))
        .filter(Boolean)
        .map((k) => String(k).toUpperCase())
);

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

const detectDecimalMark = (texts) => {
    let dot = 0;
    let comma = 0;
    for (const text of texts) {
        const s = numberToken(text);
        const mark = s && unambiguousDecimalMark(s);
        if (mark === ".") dot++;
        if (mark === ",") comma++;
    }
    return comma > dot ? "," : ".";
};

const parseReading = (text, decimalMark) => {
    let s = numberToken(text);
    if (!s) return null;
    const mark = unambiguousDecimalMark(s) || decimalMark;
    s = mark === "," ? s.replace(/\./g, "").replace(",", ".") : s.replace(/,/g, "");
    const n = parseFloat(s);
    return Number.isNaN(n) ? null : n;
};

const isNumeric = (sensor) => String(sensor.sensorType || "").startsWith("NUMBER");

const sensors = (Array.isArray(data) ? data : []).filter((s) => s && s.guid);
const decimalMark = detectDecimalMark(sensors.filter(isNumeric).map((s) => s.value));

// `value` is the formatted reading ("21.5 °C"); `rawValue` may be unscaled, so prefer the
// leading number of `value` and fall back to `rawValue` (unformatted) only when that has none.
const toNumber = (sensor) => {
    if (!isNumeric(sensor)) {
        return null;
    }
    const parsed = parseReading(sensor.value, decimalMark);
    return parsed !== null ? parsed : parseReading(sensor.rawValue, ".");
};

result = sensors
    .filter((s) => deviceIds.size === 0 || deviceIds.has(s.podId))
    .filter((s) => kinds.size === 0 || kinds.has(String(s.kind || "").toUpperCase()))
    .map((s) => ({
        guid: s.guid,
        label: s.label || s.guid,
        deviceGuid: s.podId,
        kind: s.kind,
        sensorType: s.sensorType,
        location: s.location,
        numericValue: toNumber(s),
        units: s.units,
        value: s.value,
        rawValue: s.rawValue,
        severityText: s.severityText
    }));
