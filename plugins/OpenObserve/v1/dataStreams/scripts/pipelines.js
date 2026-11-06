// dataStreams/scripts/pipelines.js
// Array-valued fields (nodes/edges) arrive at valueExpression already stringified
// ("[object Array]" or a JSON-text blob), so .length there counts characters, not
// elements. Compute real counts here, and stringify the nested json-shaped fields
// so they render as JSON rather than "[object Object]".
// last_error is absent on healthy pipelines and its shape is undocumented, so
// it's a plain string column (a null in a json-shaped column fails to format):
// empty when absent, the text itself if a string, compact JSON otherwise.
// paused_at is in microseconds, like the other v2 timestamps - converted to ISO 8601.
const errorText = (err) => (err == null ? "" : typeof err === "string" ? err : JSON.stringify(err));

result = (data.list || []).map((p) => {
    const nodes = p.nodes || [];
    const edges = p.edges || [];
    return {
        pipeline_id: p.pipeline_id,
        name: p.name,
        description: p.description || "",
        enabled: p.enabled,
        version: p.version,
        paused_at: p.paused_at != null ? new Date(p.paused_at / 1000).toISOString() : null,
        last_error: errorText(p.last_error),
        source: p.source != null ? JSON.stringify(p.source) : null,
        sourceStreamName: (p.source && p.source.stream_name) || "",
        sourceStreamType: (p.source && p.source.stream_type) || "",
        nodeCount: nodes.length,
        edgeCount: edges.length,
    };
});
