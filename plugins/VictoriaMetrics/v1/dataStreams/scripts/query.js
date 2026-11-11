// Response body: { status, data: { resultType, result } }
//   matrix: [{ metric, values: [[t, "v"], ...] }]   (range query)
//   vector: [{ metric, value: [t, "v"] }]            (instant query)
//   scalar / string: [t, "v"]
// Emits one row per sample with timestamp, value, a `series` label made of the
// labels that differ between series, every label as its own column, and drilldown
// link columns (e.g. `PodLink` + `PodLinkId`) for the indexed object each series belongs to.
// The `Link` suffix keeps them distinct from labels such as `pod`: tile SQL (DuckDB) treats
// column names case-insensitively, so `Pod` and `pod` would collide.
const toNumber = (v) => {
    if (v === '+Inf' || v === 'Inf') return Number.POSITIVE_INFINITY;
    if (v === '-Inf') return Number.NEGATIVE_INFINITY;
    const n = Number(v);
    return Number.isNaN(n) ? null : n;
};
const toIso = (t) => new Date(Number(t) * 1000).toISOString();

// ---- Drilldown links ------------------------------------------------------------
// Ids are built exactly as the index builds them (see labelSets.js): Kubernetes ids
// are `<cluster>/<namespace>/<name>`, where a missing cluster falls back to the data
// source's "Default cluster name". Parts a series doesn't carry (e.g. the namespace
// in `sum by (pod)`) are taken from the scoped object when they're unambiguous.
const dataSource = (Array.isArray(context.dataSources) && context.dataSources[0]) || {};
const defaultCluster = typeof dataSource.defaultCluster === 'string' ? dataSource.defaultCluster.trim() : '';
const unwrap = (v) => (Array.isArray(v) ? v[0] : v);
const scope = Array.isArray(context.config?.scope) ? context.config.scope : [];
const fromScope = (key) => {
    const values = new Set(scope.map((o) => unwrap(o?.[key])).filter((v) => v));
    return values.size === 1 ? [...values][0] : '';
};
const first = (...values) => values.find((v) => typeof v === 'string' && v.length > 0) || '';
// A label in standard, OTel dotted or OTel underscored form.
const label = (m, std, dotted) => first(std ? m[std] : '', dotted ? m[dotted] : '', dotted ? m[dotted.replace(/\./g, '_')] : '');

// Kubernetes kinds from most to least specific; only the most specific one present gets a link,
// so charts (which drill down only when a row has a single link) stay clickable.
const k8sChain = [
    { column: 'Container', std: 'container', otel: 'k8s.container.name', parts: ['namespace', 'pod'] },
    { column: 'Pod', std: 'pod', otel: 'k8s.pod.name', parts: ['namespace'] },
    { column: 'Deployment', std: 'deployment', otel: 'k8s.deployment.name', parts: ['namespace'] },
    { column: 'StatefulSet', std: 'statefulset', otel: 'k8s.statefulset.name', parts: ['namespace'] },
    { column: 'DaemonSet', std: 'daemonset', otel: 'k8s.daemonset.name', parts: ['namespace'] },
    { column: 'ReplicaSet', std: 'replicaset', otel: 'k8s.replicaset.name', parts: ['namespace'] },
    { column: 'KubeJob', std: 'job_name', otel: 'k8s.job.name', parts: ['namespace'] },
    { column: 'KubeCronJob', std: 'cronjob', otel: 'k8s.cronjob.name', parts: ['namespace'] },
    { column: 'Namespace', std: 'namespace', otel: 'k8s.namespace.name', parts: [] }
];

const linksFor = (m) => {
    const links = {};
    const cluster = first(label(m, 'cluster', 'k8s.cluster.name'), fromScope('cluster'), defaultCluster);
    const parts = {
        namespace: first(label(m, 'namespace', 'k8s.namespace.name'), fromScope('namespace')),
        pod: first(label(m, 'pod', 'k8s.pod.name'), fromScope('pod'))
    };

    const kind = k8sChain.find((k) => {
        const v = label(m, k.std, k.otel);
        return v && v !== 'POD' && k.parts.every((p) => parts[p]);
    });
    if (kind) {
        const name = label(m, kind.std, kind.otel);
        links[`${kind.column}Link`] = name;
        links[`${kind.column}LinkId`] = [cluster].concat(kind.parts.map((p) => parts[p]), [name]).join('/');
    }

    const node = label(m, 'node', 'k8s.node.name');
    if (node) {
        links.NodeLink = node;
        links.NodeLinkId = `${cluster}/${node}`;
    }
    const service = label(m, null, 'service.name');
    if (service) {
        links.ServiceLink = service;
        links.ServiceLinkId = service;
    }
    const host = label(m, null, 'host.name');
    if (host) {
        links.HostLink = host;
        links.HostLinkId = host;
    }
    const clusterLabel = label(m, 'cluster', 'k8s.cluster.name');
    if (clusterLabel && Object.keys(links).length === 0) {
        links.ClusterLink = clusterLabel;
        links.ClusterLinkId = clusterLabel;
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
        const { [pivot]: column, __name__, ...identity } = s.metric || {};
        return Object.assign({}, s, { metric: identity, column: column || __name__ || 'value' });
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
        const base = Object.assign({}, metric, linksFor(metric), { series: seriesName(metric) });
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
