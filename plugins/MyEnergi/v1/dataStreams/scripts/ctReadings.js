// cgi-jstatus-* returns every device on the hub in one response, so this scoped stream
// makes a single request and keeps only the devices that were selected.
const families = {
    zappi: { type: "Zappi", prefix: "Z" },
    eddi: { type: "Eddi", prefix: "E" },
    harvi: { type: "Harvi", prefix: "H" },
    libbi: { type: "Libbi", prefix: "L" },
};

const selected = new Map(
    (context.objects || []).map((o) => [o.rawId, o.name]),
);

// dat is DD-MM-YYYY and tim HH:MM:SS (UTC); Libbi pads tim with spaces ("14: 53: 03").
const toIso = ({ dat, tim }) => {
    const date = /^(\d{2})-(\d{2})-(\d{4})$/.exec(String(dat || "").trim());
    const time = /^(\d{1,2}):(\d{2}):(\d{2})$/.exec(String(tim || "").replace(/\s/g, ""));
    if (!date || !time) {
        return null;
    }
    return `${date[3]}-${date[2]}-${date[1]}T${time[1].padStart(2, "0")}:${time[2]}:${time[3]}Z`;
};

const rows = [];

for (const element of Array.isArray(data) ? data : []) {
    for (const [key, value] of Object.entries(element || {})) {
        const family = families[key];
        if (!family || !Array.isArray(value)) {
            continue;
        }
        for (const device of value) {
            const deviceKey = `${family.prefix}${device?.sno}`;
            if (device?.sno === undefined || !selected.has(deviceKey)) {
                continue;
            }
            const deviceName = selected.get(deviceKey) || `${family.type} ${device.sno}`;
            const lastUpdated = toIso(device);
            for (const n of [1, 2, 3, 4, 5, 6]) {
                const ctType = device[`ectt${n}`];
                // Unused clamps are reported as "None"; a used clamp reading 0 W omits ectpN.
                if (!ctType || ctType === "None") {
                    continue;
                }
                rows.push({
                    ctLabel: `${deviceName} · CT${n} · ${ctType}`,
                    deviceName,
                    deviceKey,
                    deviceType: family.type,
                    ct: n,
                    ctType,
                    power: Math.round(device[`ectp${n}`] || 0),
                    phase: device[`ect${n}p`] ?? null,
                    lastUpdated,
                });
            }
        }
    }
}

result = rows;
