// dataStreams/scripts/deviceCounts.js
//
// A live tile pages for at most 12 seconds and a tile scope holds at most 500
// objects, so neither the device list nor the Device objects can be counted
// on a dashboard past ~1,500 / 500 devices. Import runs one page at a time
// with no overall time limit, so count each page here and let tiles sum the
// handful of rows per page.
//
// The script runs once per page and sees only that page; ids include the
// page number so each page's rows are replaced, not duplicated, on re-import.
const PAGE_SIZE = 500;
const rows = Array.isArray(data) ? data : [];
const page = Number(context.pagingContext ?? 0);

const first = page * PAGE_SIZE + 1;
const range = `devices ${first}-${first + rows.length - 1}`;

const counts = new Map();
const add = (kind, label, value) => {
    const key = `${kind}|${label}`;
    const entry = counts.get(key) || { kind, label, value: 0 };
    entry.value += value;
    counts.set(key, entry);
};

// Both sides of each yes/no split are always written, so a filtered tile
// totals 0 rather than showing no data.
const binary = (kind, yes, no, test) => {
    const matched = rows.filter(test).length;
    add(kind, yes, matched);
    add(kind, no, rows.length - matched);
};

if (rows.length > 0) {
    binary("connection", "Connected", "Disconnected", (r) => r.connected === true);
    binary("reboot", "Needs Reboot", "No Reboot Needed", (r) => r.needs_reboot === true);
    binary("compliance", "Compliant", "Non-Compliant", (r) => r.compliant === true);

    for (const r of rows) {
        add("os", r.os_family || "Unknown", 1);
    }
}

result = [...counts.values()].map(({ kind, label, value }) => ({
    countId: `devices:${kind}:${label}:${page}`,
    countName: `${label} (${range})`,
    countKind: kind,
    countLabel: label,
    countValue: value,
}));
