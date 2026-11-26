// Each metric stream lists its dimensions; offer every distinct key=value pair
// so a tile can filter on attributes such as availabilityDomain or resourceId.
// The value carries the pair; the label adds the readable resource name when
// the value is an OCID.
const pairs = new Map();
for (const stream of Array.isArray(data) ? data : []) {
    const dims = stream.dimensions || {};
    const friendly = dims.resourceDisplayName || dims.resourceName;
    for (const [key, value] of Object.entries(dims)) {
        const pair = `${key}=${value}`;
        if (!pairs.has(pair)) {
            const isOcid = /^ocid1\./i.test(String(value));
            pairs.set(pair, isOcid && friendly ? `${key} = ${friendly} (${value})` : `${key} = ${value}`);
        }
    }
}
result = [...pairs.entries()]
    .sort((a, b) => a[1].localeCompare(b[1]))
    .map(([value, label]) => ({ label, value }));
