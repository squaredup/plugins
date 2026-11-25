// SummarizeMetricsData returns one object per series with its datapoints
// nested inside; flatten to one row per datapoint. A series is labelled by
// the resource it describes, falling back to its dimension values.
result = (Array.isArray(data) ? data : []).flatMap((series) => {
    const dims = series.dimensions || {};
    const label =
        dims.resourceDisplayName ||
        dims.resourceName ||
        dims.resourceId ||
        dims.resourceID ||
        Object.entries(dims)
            .map(([k, v]) => `${k}=${v}`)
            .join(", ") ||
        series.name;
    return (series.aggregatedDatapoints || []).map((point) => ({
        timestamp: point.timestamp,
        value: point.value,
        series: label,
        metric: series.name,
        unit: series.metadata?.unit ?? null,
        resourceId: dims.resourceId || dims.resourceID || null,
        dimensions: JSON.stringify(dims),
    }));
});
