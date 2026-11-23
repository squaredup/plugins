// SummarizeMetricsData returns one MetricData object per metric stream, each holding an
// array of aggregated datapoints. Flatten that into one row per datapoint and add the
// region, which the response does not carry. Object Storage names its resource id
// dimension "resourceID" and most other namespaces use "resourceId"; the display name
// dimension also varies by namespace, so take the first one present.

const first = (value) => [].concat(value ?? [])[0];

const scope = context.objects?.[0];
const region = first(scope?.region) ?? first(scope?.rawId);

const NAME_DIMENSIONS = [
    "resourceDisplayName",
    "resourceName",
    "displayName",
    "loadBalancerName",
    "resourceNameDisplay",
    "bucketName"
];

result = (Array.isArray(data) ? data : []).flatMap((series) => {
    const dimensions = series.dimensions || {};
    const resourceId = dimensions.resourceId || dimensions.resourceID || null;
    const nameKey = NAME_DIMENSIONS.find((key) => dimensions[key]);
    const resourceName = (nameKey && dimensions[nameKey]) || resourceId;

    return (series.aggregatedDatapoints || []).map((point) => ({
        timestamp: point.timestamp,
        value: point.value,
        metric: series.name,
        namespace: series.namespace,
        resourceId,
        resourceName,
        region,
        dimensions
    }));
});
