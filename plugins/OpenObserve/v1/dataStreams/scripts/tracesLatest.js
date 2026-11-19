// dataStreams/scripts/tracesLatest.js
//
// "spans" is a 2-element array ([spanCount, ...]), not a list of individual
// spans. "service_name" is an array of per-service summaries, and "models"
// an array of model names - left as-is, these would each explode into
// numbered per-index columns (service_name.0.*, service_name.1.*, ...) via
// the metadata catch-all, which reads like per-span detail even though it
// isn't. Summarize all three here instead of exploding them (array fields
// also can't be read via valueExpression, even just to count/join them -
// see project memory - so this has to happen in script). The trace-detail
// link also has to be built here: "dataSource.*" is only resolvable inside
// config strings/scripts, not inside a metadata valueExpression (confirmed
// empirically - it throws "dataSource is not defined" there).
//
// startTime/endTime/durationMs are set here as real fields rather than
// metadata-level "computed: true" + valueExpression derivations - a
// computed/derived date column doesn't show up as a "Bucket" option in the
// tile editor's Group-by UI, unlike a real field already in the script's
// row (the pattern every other date column in this plugin uses). The tile
// editor's native Group-by buckets no finer than byHour, so an optional
// "bucketInterval" param (e.g. "5m") switches this stream to pre-aggregated
// rows - one per fixed-width time window - computed here instead.
//
// start_time/end_time are nanoseconds: / 1e6 gives milliseconds, the same
// unit as bucketMs, then dates are emitted as ISO 8601.
const ds = (context.dataSources && context.dataSources[0]) || {};
const webBase = [ds.url, ds.port].filter(Boolean).join(":");
const streamName = (context.objects && context.objects[0] && context.objects[0].name) || "";

function parseIntervalMs(interval) {
    const m = /^(\d+)\s*(s|m|h)$/i.exec((interval || "").trim());
    if (!m) return null;
    const n = parseInt(m[1], 10);
    const unitMs = { s: 1000, m: 60000, h: 3600000 }[m[2].toLowerCase()];
    return n * unitMs;
}

const bucketMs = parseIntervalMs(context.config && context.config.bucketInterval);

if (bucketMs) {
    const buckets = new Map();
    for (const row of data.hits || []) {
        const bucketStart = Math.floor(row.start_time / 1000000 / bucketMs) * bucketMs;
        if (!buckets.has(bucketStart)) buckets.set(bucketStart, []);
        buckets.get(bucketStart).push(row.duration / 1000);
    }
    result = Array.from(buckets.entries())
        .sort((a, b) => a[0] - b[0])
        .map(([bucketStart, durations]) => ({
            startTime: new Date(bucketStart).toISOString(),
            traceCount: durations.length,
            avgDurationMs: durations.reduce((a, b) => a + b, 0) / durations.length,
            minDurationMs: Math.min(...durations),
            maxDurationMs: Math.max(...durations),
        }));
} else {
    result = (data.hits || []).map((row) => {
        const { spans, service_name, models, ...rest } = row;
        const fromUs = Math.floor(row.start_time / 1000);
        const toUs = Math.floor(row.end_time / 1000);
        return {
            ...rest,
            startTime: new Date(row.start_time / 1000000).toISOString(),
            endTime: new Date(row.end_time / 1000000).toISOString(),
            durationMs: row.duration / 1000,
            spanCount: (spans && spans[0]) || 0,
            serviceCount: (service_name || []).length,
            services: (service_name || []).map((s) => s.service_name),
            models: models || [],
            traceUrl: `${webBase}/web/traces/trace-details?org_identifier=${encodeURIComponent(ds.organization)}&stream=${encodeURIComponent(streamName)}&trace_id=${encodeURIComponent(row.trace_id)}&from=${fromUs}&to=${toUs}`,
        };
    });
}
