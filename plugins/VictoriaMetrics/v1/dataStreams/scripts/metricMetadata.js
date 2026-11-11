// Response body: { status, data: { metricName: [{ type, unit, help }] } }
const byMetric = data?.data && typeof data.data === 'object' ? data.data : {};
result = Object.entries(byMetric).flatMap(([metric, entries]) =>
    (Array.isArray(entries) ? entries : []).map((e) => ({ metric, type: e.type, unit: e.unit, help: e.help }))
);
