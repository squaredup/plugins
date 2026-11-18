// Prometheus-style matrix: one series per component instance, values are [unixSeconds, "string"] pairs
const rows = [];
for (const series of data?.data?.result || []) {
    const m = series.metric || {};
    for (const [ts, v] of series.values || []) {
        const n = Number(v);
        rows.push({
            timestamp: new Date(Number(ts) * 1000).toISOString(),
            value: Number.isFinite(n) ? n : null,
            component: m.app_component || null,
            instance: m.app_component_instance || null
        });
    }
}
result = rows;
