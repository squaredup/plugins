// cgi-jstatus-* returns an array of single-key elements, one per device family
// (e.g. { "zappi": [...] }), plus a trailing { "asn", "fwv" } element describing the hub.
// The object id is the family prefix plus serial (e.g. Z16042300), which is the form
// every per-device endpoint expects.
const families = {
    zappi: { type: "Zappi", prefix: "Z" },
    eddi: { type: "Eddi", prefix: "E" },
    harvi: { type: "Harvi", prefix: "H" },
    libbi: { type: "Libbi", prefix: "L" },
};

// Unused CTs and heaters are reported as the string "None".
const named = (value) => (value && value !== "None" ? value : null);

const ctTypes = (device) =>
    [1, 2, 3, 4, 5, 6]
        .map((n) => device[`ectt${n}`])
        .filter(named);

const rows = [];
let hub;

for (const element of Array.isArray(data) ? data : []) {
    for (const [key, value] of Object.entries(element || {})) {
        if (key === "asn") {
            hub = { server: value, firmware: element.fwv || null };
            continue;
        }
        const family = families[key];
        if (!family || !Array.isArray(value)) {
            continue;
        }
        for (const device of value) {
            if (device?.sno === undefined || device?.sno === null) {
                continue;
            }
            rows.push({
                deviceKey: `${family.prefix}${device.sno}`,
                name: `${family.type} ${device.sno}`,
                sourceType: family.type,
                serial: String(device.sno),
                firmware: device.fwv || null,
                phases: device.pha ?? null,
                ctTypes: ctTypes(device),
                heater1Name: named(device.ht1),
                heater2Name: named(device.ht2),
                batteryCapacity: device.mbc ?? null,
                inverterSize: device.mic ?? null,
                server: null,
            });
        }
    }
}

const hubSerial = String("{{ dataSource.hubSerial }}").trim();
if (hub && /^[0-9]+$/.test(hubSerial)) {
    rows.unshift({
        deviceKey: hubSerial,
        name: `Hub ${hubSerial}`,
        sourceType: "Hub",
        serial: hubSerial,
        firmware: hub.firmware,
        phases: null,
        ctTypes: [],
        heater1Name: null,
        heater2Name: null,
        batteryCapacity: null,
        inverterSize: null,
        server: hub.server || null,
    });
}

result = rows;
