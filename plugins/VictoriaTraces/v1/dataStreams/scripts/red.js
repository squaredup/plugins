// RED metrics from spans. The stats query returns, per group (and per time bucket for
// range queries), `calls`, `errors` and duration quantiles `p50`/`p95`/`p99` in nanoseconds,
// as separate Prometheus-style results named by `__name__`. They are merged into one row
// per group and bucket, with the call rate per second, error percentage and latencies in ms.
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

const linksFor = (m, options = {}) => {
    const links = {};
    const add = (column, name, id) => {
        links[`${column}Link`] = name;
        links[`${column}LinkId`] = id;
    };
    const done = () => options.single && Object.keys(links).length > 0;

    // Service or operation. Operations are only indexed from server and consumer spans, so a
    // row links to its operation only when its spans are known to be of those kinds - from the
    // row's own `kind`, or from `options.operationKinds` when the query selected the kind.
    const serviceAttr = attr(m, 'service.name');
    const service = first(serviceAttr, fromScope('serviceName'), fromScope('service'));
    const operation = first(m.name, m.operation);
    const kindValue = m.kind === undefined ? undefined : String(m.kind);
    const operationIndexed = kindValue === undefined ? options.operationKinds === true : OPERATION_KINDS.includes(kindValue);
    if (service && operation && operationIndexed) {
        add('Operation', operation, `${service}/${operation}`);
    } else if (serviceAttr) {
        add('Service', serviceAttr, serviceAttr);
    }
    // With `single`, a row gets only its most specific link: charts drill down only when a
    // row has exactly one. Tables of individual spans keep every link.
    if (done()) {
        return links;
    }
    const cluster = first(attr(m, 'k8s.cluster.name'), fromScope('cluster'), defaultCluster);
    const namespace = first(attr(m, 'k8s.namespace.name'), fromScope('namespace'));
    const kind = k8sChain.find((k) => attr(m, k.name) && (k.parts.length === 0 || namespace));
    if (kind) {
        const name = attr(m, kind.name);
        add(kind.column, name, [cluster].concat(kind.parts.length ? [namespace] : [], [name]).join('/'));
    }
    if (done()) {
        return links;
    }
    const node = attr(m, 'k8s.node.name');
    if (node) {
        add('Node', node, `${cluster}/${node}`);
    }
    if (done()) {
        return links;
    }
    const host = attr(m, 'host.name');
    if (host) {
        add('Host', host, host);
    }
    return links;
};

// ---- Rows -----------------------------------------------------------------------
const toNumber = (v) => {
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
};
// The span kinds the query selected (see red.json): incoming (server and consumer) by default.
const kindParam = typeof context.config?.kind === 'string' ? context.config.kind : '';
const raw = Array.isArray(data?.data?.result) ? data.data.result : [];
const instant = data?.data?.resultType === 'vector';

// Seconds each value covers: the whole timeframe for an instant query, else the step.
const tf = context.timeframe || {};
const span = Math.max(1, Number(tf.unixEnd) - Number(tf.unixStart));
// LogsQL durations such as `30s`, `1.5h`, `1h30m`, `500ms` or `1w`, in seconds.
const UNITS = { ms: 0.001, s: 1, m: 60, h: 3600, d: 86400, w: 604800, y: 31536000 };
const parseDuration = (text) => {
    const value = String(text || '').trim();
    const parts = [...value.matchAll(/(\d+(?:\.\d+)?)(ms|s|m|h|d|w|y)/g)];
    if (!value || parts.map((p) => p[0]).join('') !== value) {
        return null;
    }
    const seconds = parts.reduce((sum, p) => sum + Number(p[1]) * UNITS[p[2]], 0);
    return seconds > 0 ? seconds : null;
};
const step = parseDuration(context.config?.step) || Math.max(60, Math.ceil(span / 120));
const now = Math.floor(Date.now() / 1000);
const start = Number(tf.unixStart);
const end = Math.min(Number(tf.unixEnd), now);
// Seconds a value covers: the elapsed timeframe for an instant query, else the step.
// VictoriaTraces aligns range buckets to the step and counts each whole bucket (the first
// bucket starts at or before the timeframe start), so every bucket spans a full step.
const windowFor = () => (instant ? Math.max(1, end - start) : step);


const rows = new Map();
raw.forEach((s) => {
    const { __name__, ...group } = s.metric || {};
    const samples = Array.isArray(s.values) ? s.values : Array.isArray(s.value) ? [s.value] : [];
    samples.forEach(([t, v]) => {
        const key = JSON.stringify([t, Object.keys(group).sort().map((k) => [k, group[k]])]);
        if (!rows.has(key)) {
            const service = group[R + 'service.name'] || '';
            const operation = group.name || '';
            rows.set(key, Object.assign({}, linksFor(group, { single: true, operationKinds: !kindParam || kindParam === 'server' }), {
                timestamp: new Date(Number(t) * 1000).toISOString(),
                service: service || undefined,
                operation: operation || undefined,
                series: [service, operation].filter((x) => x).join(' / ') || 'all'
            }));
        }
        rows.get(key)[__name__] = toNumber(v);
    });
});

result = [...rows.values()].map((r) => {
    const calls = r.calls || 0;
    const ms = (ns) => (ns === null || ns === undefined ? null : ns / 1e6);
    return {
        ...r,
        calls,
        callsPerSecond: calls / windowFor(),
        errors: r.errors || 0,
        errorPercent: calls > 0 ? (100 * (r.errors || 0)) / calls : null,
        p50: ms(r.p50),
        p95: ms(r.p95),
        p99: ms(r.p99)
    };
});
