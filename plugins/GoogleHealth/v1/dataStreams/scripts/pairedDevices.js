// GET users/me/pairedDevices -> { pairedDevices: [ PairedDevice ] }
// PairedDevice: { name:"users/{u}/pairedDevices/{id}", deviceType:TRACKER|SCALE,
//   deviceVersion (product name), batteryLevel(int), batteryStatus, macAddress, lastSyncTime, features[] }
const list = data?.pairedDevices || [];

const N = (v) => {
    const n = Number(v);
    return Number.isFinite(n) ? n : undefined;
};
const idFromName = (n) => (typeof n === "string" && n.includes("/") ? n.split("/").pop() : n);
const titleCase = (t) =>
    typeof t === "string"
        ? t.toLowerCase().replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
        : undefined;

result = list.map((d) => ({
    deviceId: idFromName(d.name),
    deviceName: d.deviceVersion || titleCase(d.deviceType) || "Device",
    deviceType: titleCase(d.deviceType),
    batteryLevel: N(d.batteryLevel),
    batteryStatus: d.batteryStatus,
    lastSyncTime: d.lastSyncTime ? new Date(d.lastSyncTime) : undefined,
    featureCount: Array.isArray(d.features) ? d.features.length : undefined,
    macAddress: d.macAddress,
}));
