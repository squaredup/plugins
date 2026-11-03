// Time-series data usually lands in one index per day or rollover (otel-logs-2026.10.16,
// logs-000042), so offer a wildcard pattern for each family ahead of the individual names.
const FAMILY = [
    /^(.+?[-_.])[0-9]{4}[-_.][0-9]{2}([-_.][0-9]{2})?([-_.].*)?$/, // date suffix
    /^(.+?[-_])[0-9]{6}$/ // rollover counter
];

const names = (data || []).map((r) => r.index).filter(Boolean);
const families = new Map();
for (const name of names) {
    for (const pattern of FAMILY) {
        const match = name.match(pattern);
        if (match) {
            const wildcard = `${match[1]}*`;
            families.set(wildcard, (families.get(wildcard) || 0) + 1);
            break;
        }
    }
}

result = [
    ...[...families.entries()]
        .filter(([, count]) => count > 1)
        .map(([wildcard, count]) => ({ value: wildcard, label: `${wildcard} (${count} indices)` })),
    ...names.map((name) => ({ value: name, label: name }))
];
