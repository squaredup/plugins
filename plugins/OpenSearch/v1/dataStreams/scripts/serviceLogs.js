// Log documents keep OpenTelemetry attributes either as nested objects (resource.service.name)
// or as literal dotted keys, depending on the exporter, so look fields up both ways.
const get = (obj, path) => {
    if (obj === null || typeof obj !== 'object') return undefined;
    if (path in obj) return obj[path];
    const parts = path.split('.');
    for (let i = parts.length - 1; i > 0; i--) {
        const head = parts.slice(0, i).join('.');
        if (head in obj) return get(obj[head], parts.slice(i).join('.'));
    }
    return undefined;
};

// OpenTelemetry SeverityNumber ranges: 1-4 TRACE, 5-8 DEBUG, 9-12 INFO, 13-16 WARN, 17-20 ERROR, 21-24 FATAL
const severityName = (n) => {
    if (typeof n !== 'number' || n < 1) return 'Unspecified';
    return ['Trace', 'Debug', 'Info', 'Warn', 'Error', 'Fatal'][Math.min(Math.floor((n - 1) / 4), 5)];
};

// Date fields can be stored as epoch milliseconds as well as ISO strings
const isoTimestamp = (v) => (typeof v === 'number' ? new Date(v).toISOString() : v);

const serviceField ='{{ (dataSource.otelServiceField || "resource.service.name.keyword").replace(/[.]keyword$/, "") }}';
const timestampField = '{{ dataSource.otelTimestampField || "@timestamp" }}';
const severityField = '{{ dataSource.otelSeverityField || "severity.number" }}';

result = ((data && data.hits && data.hits.hits) || []).map((hit) => {
    const doc = hit._source || {};
    const body = get(doc, 'body');
    return {
        timestamp: isoTimestamp(get(doc, timestampField)),
        service: get(doc, serviceField),
        severity: severityName(get(doc, severityField)),
        message: typeof body === 'string' ? body : JSON.stringify(body),
        traceId: get(doc, 'traceId') || null,
        spanId: get(doc, 'spanId') || null,
        pod: get(doc, 'resource.k8s.pod.name') || null,
        _index: hit._index,
        _id: hit._id
    };
});
