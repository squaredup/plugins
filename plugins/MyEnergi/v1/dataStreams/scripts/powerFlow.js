// cgi-jstatus-* returns one element per device family plus a trailing hub element.
// Every device repeats the same site-level grd/gen, so read them from one device,
// preferring a device that has a Grid CT as its measurement is the most direct.
const families = ["zappi", "eddi", "harvi", "libbi"];

const devices = [];
for (const element of Array.isArray(data) ? data : []) {
    for (const family of families) {
        if (Array.isArray(element?.[family])) {
            for (const device of element[family]) {
                if (device) {
                    devices.push({ family, device });
                }
            }
        }
    }
}

const hasGridCt = ({ device }) =>
    [1, 2, 3, 4, 5, 6].some((n) => device[`ectt${n}`] === "Grid");
const hasGrid = ({ device }) => typeof device.grd === "number";
const source = (
    devices.find((d) => hasGridCt(d) && hasGrid(d)) ||
    devices.find(hasGrid) ||
    devices[0]
)?.device;

// The API omits zero values, so a missing div means the device is idle.
const sumDiv = (family) =>
    devices
        .filter((d) => d.family === family)
        .reduce((total, { device }) => total + (device.div || 0), 0);

// dat is DD-MM-YYYY and tim HH:MM:SS (UTC); some firmware pads tim with spaces.
const toIso = ({ dat, tim }) => {
    const date = /^(\d{2})-(\d{2})-(\d{4})$/.exec(String(dat || "").trim());
    const time = /^(\d{1,2}):(\d{2}):(\d{2})$/.exec(String(tim || "").replace(/\s/g, ""));
    if (!date || !time) {
        return null;
    }
    return `${date[3]}-${date[2]}-${date[1]}T${time[1].padStart(2, "0")}:${time[2]}:${time[3]}Z`;
};
const lastUpdated = devices
    .map(({ device }) => toIso(device))
    .filter(Boolean)
    .sort()
    .pop() || null;

const grid = source?.grd || 0;
const generation = Math.max(source?.gen || 0, 0);
const evCharge = sumDiv("zappi");
const hotWater = sumDiv("eddi");
const battery = sumDiv("libbi");
// Battery discharge (negative) counts as supply, so it adds to consumption.
const consumption = grid + generation - battery;

result = [
    {
        gridPower: Math.round(grid),
        importPower: Math.round(Math.max(grid, 0)),
        exportPower: Math.round(Math.max(-grid, 0)),
        generationPower: Math.round(generation),
        consumptionPower: Math.round(consumption),
        houseLoadPower: Math.round(Math.max(consumption - evCharge - hotWater, 0)),
        evChargePower: Math.round(evCharge),
        hotWaterPower: Math.round(hotWater),
        batteryPower: Math.round(battery),
        lastUpdated,
    },
];
