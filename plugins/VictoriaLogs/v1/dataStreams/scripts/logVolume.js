// Response body: { hits: [{ fields: { <field>: value }, timestamps: [iso, ...], values: [n, ...], total }] }
// Emits one row per bucket with the log count, a `series` name from the split field (if any)
// and drilldown link columns when the split field identifies an object (e.g. service.name).
// ---- Drilldown links ------------------------------------------------------------
// Ids are built exactly as the index builds them (see labelSets.js): Kubernetes ids
// are `<cluster>/<namespace>/<name>`, where a missing cluster falls back to the data
// source's "Default cluster name". Parts a row doesn't carry are taken from the
// scoped object when unambiguous. Columns are named `<Kind>Link` / `<Kind>LinkId` so
// they never collide with fields such as `pod` (tile SQL treats names case-insensitively).
const dataSource = (Array.isArray(context.dataSources) && context.dataSources[0]) || {};
const defaultCluster = typeof dataSource.defaultCluster === 'string' ? dataSource.defaultCluster.trim() : '';
const unwrap = (v) => (Array.isArray(v) ? v[0] : v);
const scope = Array.isArray(context.config?.scope) ? context.config.scope : [];
const fromScope = (key) => {
    const values = new Set(scope.map((o) => unwrap(o?.[key])).filter((v) => v));
    return values.size === 1 ? [...values][0] : '';
};
const first = (...values) => values.find((v) => typeof v === 'string' && v.length > 0) || '';
// A field in any supported convention: OpenTelemetry, Vector, Fluent Bit or plain labels.
const FIELDS = {
    cluster: ['k8s.cluster.name', 'cluster'],
    node: ['k8s.node.name', 'kubernetes.pod_node_name', 'kubernetes.host', 'node'],
    namespace: ['k8s.namespace.name', 'kubernetes.pod_namespace', 'kubernetes.namespace_name', 'namespace'],
    pod: ['k8s.pod.name', 'kubernetes.pod_name', 'pod'],
    container: ['k8s.container.name', 'kubernetes.container_name', 'container'],
    deployment: ['k8s.deployment.name'],
    statefulset: ['k8s.statefulset.name'],
    daemonset: ['k8s.daemonset.name'],
    replicaset: ['k8s.replicaset.name'],
    job: ['k8s.job.name'],
    cronjob: ['k8s.cronjob.name']
};
const field = (m, key) => first(...FIELDS[key].map((f) => m[f]));

// Kubernetes kinds from most to least specific; only the most specific one present gets a link,
// so charts (which drill down only when a row has a single link) stay clickable.
const k8sChain = [
    { column: 'Container', key: 'container', parts: ['namespace', 'pod'] },
    { column: 'Pod', key: 'pod', parts: ['namespace'] },
    { column: 'Deployment', key: 'deployment', parts: ['namespace'] },
    { column: 'StatefulSet', key: 'statefulset', parts: ['namespace'] },
    { column: 'DaemonSet', key: 'daemonset', parts: ['namespace'] },
    { column: 'ReplicaSet', key: 'replicaset', parts: ['namespace'] },
    { column: 'KubeJob', key: 'job', parts: ['namespace'] },
    { column: 'KubeCronJob', key: 'cronjob', parts: ['namespace'] },
    { column: 'Namespace', key: 'namespace', parts: [] }
];

const linksFor = (m) => {
    const links = {};
    const cluster = first(field(m, 'cluster'), fromScope('cluster'), defaultCluster);
    const parts = {
        namespace: first(field(m, 'namespace'), fromScope('namespace')),
        pod: first(field(m, 'pod'), fromScope('pod'))
    };
    const kind = k8sChain.find((k) => {
        const v = field(m, k.key);
        return v && v !== 'POD' && k.parts.every((p) => parts[p]);
    });
    if (kind) {
        const name = field(m, kind.key);
        links[`${kind.column}Link`] = name;
        links[`${kind.column}LinkId`] = [cluster].concat(kind.parts.map((p) => parts[p]), [name]).join('/');
    }
    const node = field(m, 'node');
    if (node) {
        links.NodeLink = node;
        links.NodeLinkId = `${cluster}/${node}`;
    }
    const service = first(m['service.name']);
    if (service) {
        links.ServiceLink = service;
        links.ServiceLinkId = service;
    }
    const host = first(m['host.name']);
    if (host) {
        links.HostLink = host;
        links.HostLinkId = host;
    }
    const clusterField = field(m, 'cluster');
    if (clusterField && Object.keys(links).length === 0) {
        links.ClusterLink = clusterField;
        links.ClusterLinkId = clusterField;
    }
    return links;
};

// ---- Rows -----------------------------------------------------------------------
const groups = Array.isArray(data?.hits) ? data.hits : [];
const rows = [];
groups.forEach((g) => {
    const fields = g.fields || {};
    const keys = Object.keys(fields);
    const series = keys.length === 0 ? 'logs' : keys.map((k) => fields[k] || '(none)').join(', ');
    const base = Object.assign({}, fields, linksFor(fields), { series });
    (g.timestamps || []).forEach((t, i) => {
        rows.push(Object.assign({}, base, { timestamp: t, logs: Number(g.values[i]) }));
    });
});
result = rows;
