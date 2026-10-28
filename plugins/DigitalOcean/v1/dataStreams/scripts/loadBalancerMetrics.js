// Flattens Prometheus-style matrix results into one row per sample, labelled by the labels other than lb_id and region (constant per LB, so noise)
result = (data.data?.result || []).flatMap((r) => {
    const labels = Object.entries(r.metric || {})
        .filter(([k]) => k !== "lb_id" && k !== "region")
        .map(([, v]) => v);
    const series = labels.length ? labels.join(" / ") : "Total";
    return (r.values || []).map(([ts, v]) => ({
        timestamp: new Date(Number(ts) * 1000).toISOString(),
        series,
        value: Number(v)
    }));
});
