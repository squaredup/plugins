// dataStreams/scripts/prepatchCounts.js
//
// Count each page of the pre-patch report so tiles can total the whole
// estate from imported rows, for the same reason as deviceCounts.js. Only
// per-device and per-operation counts are used because they add up across
// pages; the report's own severity counts are over distinct software
// versions within one response and do not.
//
// One operation is one entry in a device's `patches` list (device x package
// version), matching how Automox defines the report's `total`.
const rows = (data && data.prepatch && data.prepatch.devices) || [];
const offset = Number(context.pagingContext ?? 0);
const range = `devices ${offset + 1}-${offset + rows.length}`;

const SEVERITIES = ["Critical", "High", "Medium", "Low", "None", "Unknown"];
const severityLabel = (value) => {
    const match = SEVERITIES.find((s) => s.toLowerCase() === String(value ?? "").toLowerCase());
    return match || "Unknown";
};

const asList = (patches) => (Array.isArray(patches) ? patches : patches ? [patches] : []);

const bySeverity = Object.fromEntries(SEVERITIES.map((s) => [s, 0]));
let devices = 0;
let operations = 0;

for (const device of rows) {
    const patches = asList(device.patches);
    if (patches.length === 0) {
        continue;
    }
    devices += 1;
    operations += patches.length;
    for (const patch of patches) {
        bySeverity[severityLabel(patch.severity)] += 1;
    }
}

const row = (kind, label, value) => ({
    countId: `prepatch:${kind}:${label}:${offset}`,
    countName: `${label} (${range})`,
    countKind: kind,
    countLabel: label,
    countValue: value,
});

result =
    rows.length === 0
        ? []
        : [
              row("devices", "Devices with Pending Patches", devices),
              row("operations", "Pending Patch Operations", operations),
              ...SEVERITIES.map((s) => row("severity", s, bySeverity[s])),
          ];
