// cgi-jstatus-* returns an array of single-key elements, one per device family
// (e.g. { "zappi": [...] }). One request covers every selected device, so the
// rows are filtered to the selected objects by device key (prefix + serial).
const families = {
    zappi: { type: "Zappi", prefix: "Z" },
    eddi: { type: "Eddi", prefix: "E" },
    harvi: { type: "Harvi", prefix: "H" },
    libbi: { type: "Libbi", prefix: "L" },
};

const STALE_MS = 15 * 60 * 1000;

const unknown = (code) => `Unknown (${code})`;
const lookup = (table, code) => (table[code] !== undefined ? table[code] : unknown(code));

const zappiStatus = { 0: "Starting", 1: "Waiting for surplus", 2: "DSR", 3: "Charging", 4: "Boosting", 5: "Charge complete", 6: "Stopped" };
const eddiStatus = { 1: "Waiting for surplus", 3: "Diverting", 4: "Boosting", 5: "Max temperature reached", 6: "Stopped" };
const zappiMode = { 1: "Fast", 2: "Eco", 3: "Eco+", 4: "Stop" };
const plugStatus = { A: "EV disconnected", B1: "EV connected", B2: "Waiting for EV", C1: "EV ready to charge", C2: "Charging", F: "Fault" };

// Libbi codes from pymyenergi. Fault codes are split out so health can flag them.
const libbiOk = {
    0: "Off", 1: "On", 2: "Battery Full", 4: "Idle", 5: "Charging", 6: "Discharging",
    7: "Duration Charging", 8: "Duration Drain", 11: "Stopped", 12: "Target Charge",
    51: "Boosting", 53: "Boosting", 55: "Boosting", 101: "Battery Empty", 102: "Battery Full",
    104: "Full", 233: "SoC Recovery", 234: "Calibration Charge", 251: "Upgrading DSP",
    252: "Upgrading ARM", 253: "BMS Upgrading",
};
const libbiFault = {
    58: "Generation CT Polarity", 106: "Grid CT Lost", 107: "Local Comms Lost",
    151: "Inverter Undervoltage", 152: "Inverter Overvoltage", 153: "Inverter Under Frequency",
    154: "Inverter Over Frequency", 156: "Battery Lost", 157: "Battery Undervoltage",
    158: "Battery Voltage Low", 159: "Battery Voltage High", 160: "Overload",
    161: "GFCI Over Threshold", 163: "Fan Fault", 164: "Bat Under Capacity",
    165: "BMS Discharge Over Current", 166: "BMS Charge Over Current", 167: "BMS Over Voltage",
    168: "BMS Over Temperature", 169: "BMS Discharge Temperature Low", 170: "Battery Voltage Imbalance",
    171: "BMS Communications Fault", 172: "BMS Under Voltage", 173: "BMS Charge Temperature Low",
    174: "BMS Voltage High", 175: "BMS Temperature High", 176: "Grid CT Polarity",
    183: "Inv Comms Lost", 184: "Controller Undervoltage", 185: "Controller Overvoltage",
    186: "Controller Under Frequency", 187: "Controller Over Frequency", 201: "Soft Timeout",
    202: "Internal Voltage Short", 203: "GFCI Sensor Fault", 205: "Bus Low Fault",
    206: "Bus High Fault", 207: "Bus Short Fault", 208: "PV ISO Under", 209: "PV Input Short Circuit",
    210: "Bypass Relay Fault", 211: "Inverter Overcurrent", 212: "Inverter DC Over",
    213: "Ambient Over Temperature", 214: "Sink Over Temperature", 215: "Grid Relay Fault",
    216: "Discharge Overcurrent", 217: "Charge Overcurrent", 219: "Inverter Abnormal",
    220: "EPS Relay Fault", 232: "SCI Fault",
};

const named = (value) => (value && value !== "None" ? value : null);
const num = (value) => (typeof value === "number" ? value : 0);

// dat is DD-MM-YYYY and tim is HH:MM:SS, both UTC; some firmware pads tim with spaces.
const parseTimestamp = (device) => {
    const date = /^(\d{2})-(\d{2})-(\d{4})$/.exec(String(device.dat || "").replace(/\s/g, ""));
    const time = /^(\d{1,2}):(\d{2}):(\d{2})$/.exec(String(device.tim || "").replace(/\s/g, ""));
    if (!date || !time) {
        return null;
    }
    const iso = `${date[3]}-${date[2]}-${date[1]}T${time[1].padStart(2, "0")}:${time[2]}:${time[3]}Z`;
    return Number.isNaN(Date.parse(iso)) ? null : iso;
};

// Very old firmware reported volts rather than decivolts.
const voltage = (vol) => {
    const v = num(vol);
    return v > 1000 ? v / 10 : v;
};

// 127 and -1 mean no probe is fitted.
const temperature = (value) => (typeof value === "number" && value !== 127 && value !== -1 ? value : null);

const activeHeater = (device) => {
    const n = device.hno;
    if (!n) {
        return null;
    }
    return named(device[`ht${n}`]) || `Heater ${n}`;
};

const describe = (type, device) => {
    switch (type) {
        case "Zappi": {
            const plug = device.pst;
            return {
                status: plug === "A" ? plugStatus.A : lookup(zappiStatus, device.sta),
                fault: plug === "F",
                mode: device.zmo !== undefined ? zappiMode[device.zmo] || null : null,
                plugStatus: plug ? plugStatus[plug] || unknown(plug) : null,
            };
        }
        case "Eddi":
            return { status: lookup(eddiStatus, device.sta), fault: false, mode: null, plugStatus: null };
        case "Libbi": {
            const code = device.sta;
            const mode = named(device.lmo);
            return {
                status: libbiFault[code] || libbiOk[code] || unknown(code),
                fault: libbiFault[code] !== undefined,
                mode: mode ? mode.charAt(0).toUpperCase() + mode.slice(1).toLowerCase() : null,
                plugStatus: null,
            };
        }
        default:
            return { status: null, fault: false, mode: null, plugStatus: null };
    }
};

const selected = new Map(
    (context.objects || []).map((o) => [String(o.rawId), o.name]),
);

const now = Date.now();
const rows = [];

for (const element of Array.isArray(data) ? data : []) {
    for (const [key, value] of Object.entries(element || {})) {
        const family = families[key];
        if (!family || !Array.isArray(value)) {
            continue;
        }
        for (const device of value) {
            if (device?.sno === undefined || device?.sno === null) {
                continue;
            }
            const deviceKey = `${family.prefix}${device.sno}`;
            if (!selected.has(deviceKey)) {
                continue;
            }
            const lastUpdated = parseTimestamp(device);
            const stale = !lastUpdated || now - Date.parse(lastUpdated) > STALE_MS;
            const info = describe(family.type, device);
            // Harvi reports no status; fresh data is the only signal it is working.
            const status = family.type === "Harvi" ? (stale ? "No recent data" : "Reporting") : info.status;
            const isLibbi = family.type === "Libbi";

            rows.push({
                deviceName: selected.get(deviceKey) || `${family.type} ${device.sno}`,
                deviceKey,
                deviceType: family.type,
                status,
                health: info.fault ? "error" : stale ? "warning" : "success",
                mode: info.mode,
                plugStatus: info.plugStatus,
                power: family.type === "Harvi" ? null : num(device.div),
                energy: family.type === "Harvi" || isLibbi ? null : num(device.che),
                activeHeater: family.type === "Eddi" ? activeHeater(device) : null,
                tank1Temperature: family.type === "Eddi" ? temperature(device.tp1) : null,
                tank2Temperature: family.type === "Eddi" ? temperature(device.tp2) : null,
                batteryLevel: isLibbi && typeof device.soc === "number" ? device.soc : null,
                minGreenLevel: family.type === "Zappi" && typeof device.mgl === "number" ? device.mgl : null,
                boosting: Boolean(device.bsm || device.bst || device.bss),
                voltage: voltage(device.vol),
                frequency: num(device.frq),
                gridPower: num(device.grd),
                lastUpdated,
                firmware: device.fwv || null,
            });
        }
    }
}

result = rows;
