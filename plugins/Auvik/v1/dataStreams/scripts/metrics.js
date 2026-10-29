// Flattens Auvik statistics into one row per data point and series. Each stat
// entry carries a legend (first column is the recorded-at time in unix minutes)
// and data rows of [time, value1, value2, ...].
const unwrap = (v) => (Array.isArray(v) ? v[0] : v);
const rawMetric = context.config && context.config.metric;
const metric =
    (Array.isArray(rawMetric) ? rawMetric[0] && (rawMetric[0].value || rawMetric[0]) : rawMetric) ||
    "device/cpuUtilization";
const family = metric.split("/")[0];

const selectedDevices = new Set(
    ((context.config && context.config.device) || []).map((o) => unwrap(o.rawId)).filter(Boolean),
);

// Normalise Auvik unit identifiers into readable labels; bit rates are scaled
// to Mbps so bandwidth values are legible without a per-row shape.
const unitInfo = (unit) => {
    const u = String(unit || "").toLowerCase();
    if (u.includes("bit")) return { label: "Mbps", scale: 1e-6 };
    if (u.includes("percent") || u === "%") return { label: "%", scale: 1 };
    if (u.includes("packet")) return { label: u.includes("per") ? "pps" : "packets", scale: 1 };
    if (u.includes("milli")) return { label: "ms", scale: 1 };
    if (u.startsWith("sec") || u === "s") return { label: "s", scale: 1 };
    if (u.includes("kilobyte")) return { label: "KB/s", scale: 1 };
    if (u.includes("megabyte")) return { label: "MB", scale: 1 };
    if (u.includes("megahertz") || u === "mhz") return { label: "MHz", scale: 1 };
    if (u.includes("celsius")) return { label: "°C", scale: 1 };
    if (u.includes("rpm")) return { label: "rpm", scale: 1 };
    if (u.includes("volt")) return { label: "V", scale: 1 };
    if (u.includes("amp")) return { label: "A", scale: 1 };
    if (u.includes("watt")) return { label: "W", scale: 1 };
    return { label: u.replace(/_per_/g, "/").replace(/_/g, " "), scale: 1 };
};

// Stats mix a combined value (e.g. "Bandwidth", "Utilization") with transmit/receive
// splits, or report it alone; name the combined one "Total" either way so tiles can
// pick it reliably.
const seriesName = (name, index) => {
    if (!name) return `Value ${index}`;
    if (!/transmit|receive|tx|rx|read|write|in$|out$/i.test(name) && /total|bandwidth|utilization|loss|discard/i.test(name)) {
        return "Total";
    }
    return name;
};

// Internet checks name their packet counts loosely ("Transmitted", "Packets Sent", ...).
const findValue = (values, pattern) => {
    const key = Object.keys(values).find((k) => pattern.test(k));
    return key === undefined ? NaN : Number(values[key]);
};

const toIso = (unixMinutes) => new Date(Number(unixMinutes) * 60000).toISOString();

// Spec documents `data` as an object, the support docs as one entry per entity.
const entries = Array.isArray(data && data.data) ? data.data : data && data.data ? [data.data] : [];

const rows = [];
const pushStats = (stats, base) => {
    for (const stat of stats || []) {
        const legend = stat.legend || [];
        const units = stat.unit || [];
        const instanceId = stat.name || stat.index;
        const instance = stats.length > 1 && instanceId !== undefined && instanceId !== null && instanceId !== "" ? instanceId : null;
        const entityName = instance !== null ? `${base.entityName} ${instance}` : base.entityName;
        for (const point of stat.data || []) {
            if (!Array.isArray(point) || point.length < 2) continue;
            const timestamp = toIso(point[0]);
            const values = {};
            for (let i = 1; i < point.length; i++) {
                const raw = point[i];
                const series = seriesName(legend[i], i);
                values[series] = raw;
                if (raw === null || raw === undefined) continue;
                const { label: unit, scale } = unitInfo(units[i]);
                rows.push({
                    ...base,
                    entityName,
                    timestamp,
                    series,
                    value: Number(raw) * scale,
                    unit,
                    label: point.length > 2 ? `${entityName} ${series}` : entityName,
                });
            }
            // Internet checks report packets sent and received; loss % is what matters.
            if (family === "service") {
                const sent = findValue(values, /transmit|sent/i);
                const received = findValue(values, /receiv/i);
                if (sent > 0 && !Number.isNaN(received)) {
                    rows.push({
                        ...base,
                        entityName,
                        timestamp,
                        series: "Loss",
                        value: Math.max(0, ((sent - received) / sent) * 100),
                        unit: "%",
                        label: `${entityName} Loss`,
                    });
                }
            }
        }
    }
};

for (const entry of entries) {
    const rel = entry.relationships || {};
    const attrs = entry.attributes || {};
    const tenantId = (rel.tenant && rel.tenant.data && rel.tenant.data.id) || null;
    const statType = attrs.statType || metric;

    if (family === "service") {
        const svc = (rel.service && rel.service.data) || {};
        const serviceName = (svc.attributes && svc.attributes.serviceName) || svc.serviceName || "Internet check";
        for (const endpoint of attrs.endpoints || []) {
            pushStats(endpoint.stats, {
                metric: statType,
                entityId: endpoint.id || entry.id,
                entityName: endpoint.ipAddress ? `${serviceName} (${endpoint.ipAddress})` : serviceName,
                entityType: "Internet check",
                // No device: leaving deviceId out (not null) drops the Device lookup column.
                tenantId,
            });
        }
        continue;
    }

    const kind = family === "interface" ? "interface" : family === "component" ? "component" : "device";
    const ent = (rel[kind] && rel[kind].data) || {};
    const entAttrs = ent.attributes || {};
    const name =
        ent[`${kind}Name`] || entAttrs[`${kind}Name`] || ent.name || entAttrs.name || ent.id || entry.id;
    const deviceId = kind === "device" ? ent.id : ent.parentDevice || entAttrs.parentDevice || null;
    if (selectedDevices.size && !selectedDevices.has(deviceId)) continue;

    pushStats(attrs.stats, {
        metric: statType,
        entityId: ent.id || entry.id,
        entityName: name,
        entityType: kind === "device" ? "Device" : kind === "interface" ? "Interface" : "Component",
        deviceId,
        tenantId,
    });
}

// Devices can share a name (every Auvik collector is "auvik-virtual-appliance"), which
// would merge their series on a chart. Suffix the duplicates with the end of each device's own
// ID: the platform runs this script once per page, so a running number could repeat across pages.
const shortId = (id) => {
    try {
        return atob(id).split(",").pop().slice(-4);
    } catch (e) {
        return String(id).slice(-4);
    }
};
const idsByName = {};
for (const r of rows) {
    if (r.entityType !== "Device") continue;
    (idsByName[r.entityName] = idsByName[r.entityName] || new Set()).add(r.entityId);
}
for (const r of rows) {
    const ids = r.entityType === "Device" && idsByName[r.entityName];
    if (!ids || ids.size < 2) continue;
    const name = `${r.entityName} (${shortId(r.entityId)})`;
    r.label = name + r.label.slice(r.entityName.length);
    r.entityName = name;
}

result = rows;
