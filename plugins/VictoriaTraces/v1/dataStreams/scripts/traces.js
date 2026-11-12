// One row per trace. The query keeps whole traces: it selects the ids of traces with a
// matching span (and, when objects are selected, a span from those objects) in a subquery,
// then summarises every span of those traces. Results come back as Prometheus-style
// results per trace, named by `__name__`, with the root span's name and service in `root`.
const R = 'resource_attr:';

// ---- Rows -----------------------------------------------------------------------
const raw = Array.isArray(data?.data?.result) ? data.data.result : [];
const traces = new Map();
raw.forEach((s) => {
    const m = s.metric || {};
    if (!m.trace_id) {
        return;
    }
    if (!traces.has(m.trace_id)) {
        let root = {};
        try {
            root = JSON.parse(m.root || '{}');
        } catch (e) {
            root = {};
        }
        traces.set(m.trace_id, { traceId: m.trace_id, root });
    }
    traces.get(m.trace_id)[m.__name__] = Number(s.value?.[1]);
});

const order = context.config?.sort === 'newest' ? 'newest' : 'slowest';
result = [...traces.values()]
    .map((t) => {
        const service = t.root[R + 'service.name'] || '';
        const operation = t.root.name || '';
        // Link to the root service: root spans are often internal or client spans, which aren't
        // indexed as operations.
        return Object.assign(service ? { ServiceLink: service, ServiceLinkId: service } : {}, {
            traceId: t.traceId,
            start: Number.isFinite(t.start_ns) ? new Date(t.start_ns / 1e6).toISOString() : null,
            rootService: service,
            rootOperation: operation,
            durationMs: Number.isFinite(t.duration_ms) ? t.duration_ms : null,
            spans: t.spans || 0,
            errors: t.errors || 0,
            status: (t.errors || 0) > 0 ? 'error' : 'success'
        });
    })
    .sort((a, b) => (order === 'newest' ? (b.start || '').localeCompare(a.start || '') : (b.durationMs || 0) - (a.durationMs || 0)));
