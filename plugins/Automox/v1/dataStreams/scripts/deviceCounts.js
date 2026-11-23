// dataStreams/scripts/deviceCounts.js
//
// Counts one page of /servers into a few rows that dashboard tiles sum. Live
// tiles can't count a large estate (they page for at most 12 seconds and a
// scope holds at most 500 objects), but import reads every page.
//
// Ids include the page number so each page's rows replace, not duplicate,
// the previous import's.
const devices = Array.isArray(data) ? data : [];
const page = context.pagingContext ?? 0;

const connected = devices.filter((d) => d.connected === true).length;
const needsReboot = devices.filter((d) => d.needs_reboot === true).length;
const compliant = devices.filter((d) => d.compliant === true).length;

const byOs = {};
for (const d of devices) {
    const os = d.os_family || "Unknown";
    byOs[os] = (byOs[os] || 0) + 1;
}

const counts = [
    ["connection", "Connected", connected],
    ["connection", "Disconnected", devices.length - connected],
    ["reboot", "Needs Reboot", needsReboot],
    ["reboot", "No Reboot Needed", devices.length - needsReboot],
    ["compliance", "Compliant", compliant],
    ["compliance", "Non-Compliant", devices.length - compliant],
    ...Object.entries(byOs).map(([os, n]) => ["os", os, n]),
];

result =
    devices.length === 0
        ? []
        : counts.map(([kind, label, value]) => ({
              countId: `devices:${kind}:${label}:${page}`,
              countName: `${label} (page ${page + 1})`,
              countKind: kind,
              countLabel: label,
              countValue: value,
          }));
