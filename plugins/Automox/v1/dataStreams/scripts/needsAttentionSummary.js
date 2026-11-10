// dataStreams/scripts/needsAttentionSummary.js
//
// Keep the report's counts and drop its device list, which is what made these
// tiles time out on a large estate. The API reference documents the body as a
// one-element array; handle that and a bare object.
const report = Array.isArray(data) ? data[0] : data;
const summary = (report && report.nonCompliant) || {};
const FIELDS = ["total", "critical", "high", "medium", "low", "none", "other"];

const row = {};
for (const field of FIELDS) {
    row[`nonCompliant.${field}`] = summary[field];
}

result = [row];
