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

// Readings are formatted in the server's locale, so the decimal mark may be "." or ",".
// When both appear, the later one is the decimal mark; a lone comma is a decimal mark unless
// it is followed by exactly three digits (a thousands separator).
const parseReading = (text) => {
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

// `value` is the formatted reading ("21.5 °C"); `rawValue` may be unscaled, so prefer the
// leading number of `value` and fall back to `rawValue` only when that has none.
const toNumber = (sensor) => {
    if (!String(sensor.sensorType || "").startsWith("NUMBER")) {
        return null;
    }
    const parsed = parseReading(sensor.value);
    return parsed !== null ? parsed : parseReading(sensor.rawValue);
};

result = (Array.isArray(data) ? data : [])
    .filter((s) => s && s.guid)
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
