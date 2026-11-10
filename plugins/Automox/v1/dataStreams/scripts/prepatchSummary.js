// dataStreams/scripts/prepatchSummary.js
//
// The report returns its counts alongside every device and every pending
// patch. Keep the counts and drop the device list, which is what made these
// tiles time out on a large estate.
const summary = (data && data.prepatch) || {};
const FIELDS = ["total", "needsAttention", "critical", "high", "medium", "low", "none", "unknown", "no_known_cves"];

const row = {};
for (const field of FIELDS) {
    row[`prepatch.${field}`] = summary[field];
}

result = [row];
