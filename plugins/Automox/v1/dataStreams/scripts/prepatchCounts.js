// dataStreams/scripts/prepatchCounts.js
//
// Counts one page of the pre-patch report into a few rows that dashboard
// tiles sum, for the same reason as deviceCounts.js. Severities count
// operations (one device x one patch) because the report's own severity
// counts are per response and don't add up across pages.
const devices = (data && data.prepatch && data.prepatch.devices) || [];
const offset = context.pagingContext ?? 0;

// Every severity is always written so a filtered tile shows 0, not no data.
const bySeverity = { Critical: 0, High: 0, Medium: 0, Low: 0, None: 0, Unknown: 0 };
let devicesWithPatches = 0;
let operations = 0;

for (const d of devices) {
    const patches = d.patches || [];
    if (patches.length > 0) devicesWithPatches += 1;
    operations += patches.length;
    for (const p of patches) {
        const s = p.severity ? p.severity[0].toUpperCase() + p.severity.slice(1).toLowerCase() : "Unknown";
        bySeverity[s in bySeverity ? s : "Unknown"] += 1;
    }
}

const counts = [
    ["devices", "Devices with Pending Patches", devicesWithPatches],
    ["operations", "Pending Patch Operations", operations],
    ...Object.entries(bySeverity).map(([s, n]) => ["severity", s, n]),
];

result =
    devices.length === 0
        ? []
        : counts.map(([kind, label, value]) => ({
              countId: `prepatch:${kind}:${label}:${offset}`,
              countName: `${label} (rows from ${offset + 1})`,
              countKind: kind,
              countLabel: label,
              countValue: value,
          }));
