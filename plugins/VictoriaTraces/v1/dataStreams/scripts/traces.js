// One row per trace. The query keeps whole traces: it selects the ids of traces with a
// matching span (and, when objects are selected, a span from those objects) in a subquery,
// then summarises every span of those traces. Results come back as Prometheus-style
// results per trace, named by `__name__`, with the root span's name and service in `root`.
// ---- Drilldown links ------------------------------------------------------------
// Ids are built exactly as the index builds them (see labelSets.js) and match the
// VictoriaMetrics and VictoriaLogs plugins: Kubernetes ids are `<cluster>/<namespace>/<name>`
// (a missing cluster falls back to the data source's "Default cluster name"), services are
// keyed by name and operations by `<service>/<operation>`. Parts a row doesn't carry are
// taken from the scoped object when unambiguous. Columns are named `<Kind>Link` / `<Kind>LinkId`.
const dataSource = (Array.isArray(context.dataSources) && context.dataSources[0]) || {};
const defaultCluster = typeof dataSource.defaultCluster === 'string' ? dataSource.defaultCluster.trim() : '';
const unwrap = (v) => (Array.isArray(v) ? v[0] : v);
const scope = Array.isArray(context.config?.scope) ? context.config.scope : [];
const fromScope = (key) => {
    const values = new Set(scope.map((o) => unwrap(o?.[key])).filter((v) => v));
    return values.size === 1 ? [...values][0] : '';
};
const first = (...values) => values.find((v) => typeof v === 'string' && v.length > 0) || '';
const R = 'resource_attr:';
const attr = (m, name) => first(m[R + name], m[name]);

const k8sChain = [
    { column: 'Pod', name: 'k8s.pod.name', parts: ['namespace'] },
    { column: 'Deployment', name: 'k8s.deployment.name', parts: ['namespace'] },
    { column: 'StatefulSet', name: 'k8s.statefulset.name', parts: ['namespace'] },
    { column: 'DaemonSet', name: 'k8s.daemonset.name', parts: ['namespace'] },
    { column: 'ReplicaSet', name: 'k8s.replicaset.name', parts: ['namespace'] },
    { column: 'KubeJob', name: 'k8s.job.name', parts: ['namespace'] },
    { column: 'KubeCronJob', name: 'k8s.cronjob.name', parts: ['namespace'] },
    { column: 'Namespace', name: 'k8s.namespace.name', parts: [] }
];
// Span kinds of the spans operations are indexed from (server, consumer).
const OPERATION_KINDS = ['2', '5', 'server', 'consumer', 'SPAN_KIND_SERVER', 'SPAN_KIND_CONSUMER'];

const linksFor = (m) => {
    const links = {};
    const cluster = first(attr(m, 'k8s.cluster.name'), fromScope('cluster'), defaultCluster);
    const namespace = first(attr(m, 'k8s.namespace.name'), fromScope('namespace'));
    const kind = k8sChain.find((k) => attr(m, k.name) && (k.parts.length === 0 || namespace));
    if (kind) {
        const name = attr(m, kind.name);
        links[`${kind.column}Link`] = name;
        links[`${kind.column}LinkId`] = [cluster].concat(kind.parts.length ? [namespace] : [], [name]).join('/');
    }
    const node = attr(m, 'k8s.node.name');
    if (node) {
        links.NodeLink = node;
        links.NodeLinkId = `${cluster}/${node}`;
    }
    // A row for one operation links to the operation rather than its service, so charts of
    // operations stay clickable (charts drill down only when a row has a single link).
    const service = first(attr(m, 'service.name'), fromScope('serviceName'), fromScope('service'));
    const operation = first(m.name, m.operation);
    const kindValue = m.kind === undefined ? undefined : String(m.kind);
    if (service && operation && (kindValue === undefined || OPERATION_KINDS.includes(kindValue))) {
        links.OperationLink = operation;
        links.OperationLinkId = `${service}/${operation}`;
    } else if (attr(m, 'service.name')) {
        links.ServiceLink = attr(m, 'service.name');
        links.ServiceLinkId = attr(m, 'service.name');
    }
    const host = attr(m, 'host.name');
    if (host) {
        links.HostLink = host;
        links.HostLinkId = host;
    }
    return links;
};

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
    .sort((a, b) => (order === 'newest' ? String(b.start).localeCompare(String(a.start)) : (b.durationMs || 0) - (a.durationMs || 0)));
