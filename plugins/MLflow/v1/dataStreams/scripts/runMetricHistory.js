// dataStreams/scripts/runMetricHistory.js
//
// The get-history response only contains {key, value, timestamp, step} per
// point — it never echoes back which run was queried. Since
// httpRequestScopedSingle combines rows from one request per selected Run
// object, each row must be tagged with its source run's identity so a
// multi-run tile can group/color by run. context.objects[0] is the Run
// object this particular request was scoped to.
var object = context.objects[0];
result = (data.metrics || []).map((m) => ({
    ...m,
    runId: object.rawId,
    runName: object.name,
}));
