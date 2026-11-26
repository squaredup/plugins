// SummarizeMetricsData returns one object per series with its datapoints
// nested inside; flatten to one row per datapoint. A series is labelled by
// the resource it describes, falling back to its dimension values.
// Some namespaces (compute) only send an OCID, so name the series after the
// matching SquaredUp object when the stream has one: the scoped object, or
// the objects picked in a "resources" parameter. OCI may upper-case OCIDs.
const unwrap = (v) => (Array.isArray(v) ? v[0] : v);
const knownObjects = [...(context.objects || []), ...[].concat(context.config?.resources || [])];
const nameById = new Map(
    knownObjects
        .filter((o) => o && unwrap(o.rawId))
        .map((o) => [String(unwrap(o.rawId)).toLowerCase(), unwrap(o.name) || unwrap(o.displayName)]),
);

// Legend format, as in the OCI Grafana plugin: {metric} and any dimension
// name, for example "{metric} - {resourceDisplayName}". Unknown names stay as
// typed. Double braces are accepted too.
const legend = String([].concat(context.config?.legendFormat ?? [])[0] || "").trim();
const applyLegend = (metricName, dims) =>
    legend.replace(/\{\{?\s*([\w.-]+)\s*\}?\}/g, (token, name) =>
        name === "metric" ? metricName : dims[name] !== undefined ? String(dims[name]) : token,
    );

result = (Array.isArray(data) ? data : []).flatMap((series) => {
    const dims = series.dimensions || {};
    const ocid = dims.resourceId || dims.resourceID;
    const label =
        dims.resourceDisplayName ||
        dims.resourceName ||
        (ocid && nameById.get(String(ocid).toLowerCase())) ||
        dims.resourceId ||
        dims.resourceID ||
        Object.entries(dims)
            .map(([k, v]) => `${k}=${v}`)
            .join(", ") ||
        series.name;
    const series_ = legend ? applyLegend(series.name, dims) : label;
    return (series.aggregatedDatapoints || []).map((point) => ({
        timestamp: point.timestamp,
        value: point.value,
        series: series_,
        metric: series.name,
        unit: series.metadata?.unit ?? null,
        resourceId: ocid || null,
        dimensions: JSON.stringify(dims),
    }));
});
