// Response body is NDJSON: one span per line (a single-span response is auto-parsed into
// one object). Emits one row per span with its trace, service, operation, kind, timing and
// status, drilldown links, and the remaining span and resource attributes in `attributes`.
// For Trace Spans (`traceId` set) rows are ordered by start time with an offset from the
// trace start, otherwise newest first.
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
const KINDS = { 0: 'unspecified', 1: 'internal', 2: 'server', 3: 'client', 4: 'producer', 5: 'consumer' };
const STATUS = { 0: 'unset', 1: 'ok', 2: 'error' };
const body = response?.body !== undefined ? response.body : data;
let spans = [];
if (typeof body === 'string') {
    spans = body
        .split('\n')
        .map((l) => l.trim())
        .filter((l) => l.length > 0)
        .map((l) => {
            try {
                return JSON.parse(l);
            } catch (e) {
                return null;
            }
        })
        .filter((s) => s);
} else if (Array.isArray(body)) {
    spans = body;
} else if (body && typeof body === 'object') {
    spans = [body];
}
// Spans have no stored stream fields of interest; drop internal index rows (no span id).
spans = spans.filter((s) => s.span_id);

const traceMode = typeof context.config?.traceId === 'string' && context.config.traceId.trim().length > 0;
const traceStart = traceMode ? Math.min(...spans.map((s) => Number(s.start_time_unix_nano)).filter((n) => Number.isFinite(n))) : null;

const rows = spans.map((s) => {
    const {
        _time, _msg, _stream, _stream_id, trace_id, span_id, parent_span_id, name, kind, duration,
        status_code, status_message, start_time_unix_nano, end_time_unix_nano, ...attributes
    } = s;
    const start = Number(start_time_unix_nano);
    const row = Object.assign(linksFor(s), {
        timestamp: Number.isFinite(start) ? new Date(start / 1e6).toISOString() : _time,
        traceId: trace_id,
        spanId: span_id,
        parentSpanId: parent_span_id || null,
        service: s[R + 'service.name'] || null,
        operation: name,
        kind: KINDS[kind] || kind || null,
        durationMs: Number.isFinite(Number(duration)) ? Number(duration) / 1e6 : null,
        status: STATUS[status_code] || status_code || null,
        statusMessage: status_message || null,
        attributes
    });
    if (traceMode) {
        row.offsetMs = Number.isFinite(start) && Number.isFinite(traceStart) ? (start - traceStart) / 1e6 : null;
    }
    return { row, start };
});

result = rows
    .sort((a, b) => (traceMode ? a.start - b.start : b.start - a.start))
    .map((r) => r.row);
