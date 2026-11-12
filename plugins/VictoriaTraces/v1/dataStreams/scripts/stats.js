// LogsQL stats results over spans come back in Prometheus format.
// Response body: { status, data: { resultType, result } }
//   matrix: [{ metric, values: [[t, "v"], ...] }]   (range query)
//   vector: [{ metric, value: [t, "v"] }]            (instant query)
//   scalar / string: [t, "v"]
// Emits one row per sample with timestamp, value, a `series` label made of the
// fields that differ between results, every `by (...)` field as its own column, and
// drilldown link columns (e.g. `PodLink` + `PodLinkId`) for the object each result belongs to.
const toNumber = (v) => {
    if (v === '+Inf' || v === 'Inf') return Number.POSITIVE_INFINITY;
    if (v === '-Inf') return Number.NEGATIVE_INFINITY;
    const n = Number(v);
    return Number.isNaN(n) ? null : n;
};
const toIso = (t) => new Date(Number(t) * 1000).toISOString();

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
const resultType = data?.data?.resultType;
const raw = data?.data?.result;

if (resultType === 'scalar' || resultType === 'string') {
    result = Array.isArray(raw) ? [{ timestamp: toIso(raw[0]), value: toNumber(raw[1]), series: 'value' }] : [];
} else {
    // Optional pivot: series that differ only by the pivot label (and metric name) are merged
    // into one row per timestamp, with one column per pivot label value. This replaces tile SQL
    // pivots, which lose drilldown links (SQL-shaped rows are re-attributed to a built-in data source).
    const pivot = typeof context.config?.pivot === 'string' ? context.config.pivot.trim() : '';
    const seriesList = (Array.isArray(raw) ? raw : []).map((s) => {
        if (!pivot) {
            return s;
        }
        // Results that differ only by the pivot field merge into one row. Unless pivoting on
        // `__name__` itself, the result name stays part of the row and the column name, so
        // several stats results (e.g. `calls` and `errors`) don't overwrite each other.
        const { [pivot]: column, ...rest } = s.metric || {};
        if (pivot === '__name__') {
            return Object.assign({}, s, { metric: rest, column: column || 'value' });
        }
        const { __name__, ...identity } = rest;
        const name = column || 'value';
        return Object.assign({}, s, { metric: identity, column: __name__ ? `${name} ${__name__}` : name });
    });

    // Labels whose value differs between series identify each series.
    const allKeys = new Set();
    seriesList.forEach((s) => Object.keys(s.metric || {}).forEach((k) => allKeys.add(k)));
    const varying = new Set(
        [...allKeys].filter((k) => new Set(seriesList.map((s) => (s.metric || {})[k])).size > 1)
    );
    const seriesName = (metric) => {
        if (seriesList.length <= 1) {
            return metric.__name__ || Object.entries(metric).map(([k, v]) => `${k}=${v}`).join(', ') || 'value';
        }
        const parts = [...varying].sort().filter((k) => metric[k] !== undefined).map((k) => (k === '__name__' ? metric[k] : `${k}=${metric[k]}`));
        return parts.join(', ') || metric.__name__ || 'value';
    };

    const rows = [];
    const pivotRows = new Map();
    seriesList.forEach((s) => {
        const metric = s.metric || {};
        const base = Object.assign({}, metric, linksFor(metric, { single: true }), { series: seriesName(metric) });
        const samples = Array.isArray(s.values) ? s.values : Array.isArray(s.value) ? [s.value] : [];
        samples.forEach(([t, v]) => {
            if (!pivot) {
                rows.push(Object.assign({}, base, { timestamp: toIso(t), value: toNumber(v) }));
                return;
            }
            const key = JSON.stringify([t, Object.keys(metric).sort().map((k) => [k, metric[k]])]);
            if (!pivotRows.has(key)) {
                pivotRows.set(key, Object.assign({}, base, { timestamp: toIso(t) }));
            }
            pivotRows.get(key)[s.column] = toNumber(v);
        });
    });
    result = pivot ? [...pivotRows.values()] : rows;
}
