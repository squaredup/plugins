// Flattens time bucket > service > severity range into one row per combination.
// auto_date_histogram is the outer level so every service shares the same intervals.
const timeBuckets = (data && data.aggregations && data.aggregations.overTime && data.aggregations.overTime.buckets) || [];

result = timeBuckets.flatMap((t) =>
    ((t.services && t.services.buckets) || []).flatMap((s) =>
        ((s.severity && s.severity.buckets) || []).map((r) => ({
            // key is always epoch milliseconds; key_as_string follows the field's mapping format
            timestamp: typeof t.key === 'number' ? new Date(t.key).toISOString() : t.key_as_string,
            service: String(s.key),
            severity: r.key,
            logs: r.doc_count
        }))
    )
);
