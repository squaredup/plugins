// Response body is NDJSON: one log entry per line, e.g.
//   {"_time":"...","_msg":"...","_stream":"{...}","_stream_id":"...","level":"info",...}
// A single-entry response is auto-parsed into one object; multi-entry responses stay text.
// Emits one row per entry, newest first, with a normalised `severity`, drilldown link
// columns and the entry's other fields.
// ---- Drilldown links ------------------------------------------------------------
// Ids are built exactly as the index builds them (see labelSets.js): Kubernetes ids
// are `<cluster>/<namespace>/<name>`, where a missing cluster falls back to the data
// source's "Default cluster name". Parts a row doesn't carry are taken from the
// scoped object when unambiguous. Columns are named `<Kind>Link` / `<Kind>LinkId` so
// they never collide with fields such as `pod` (tile SQL treats names case-insensitively).
const dataSource = (Array.isArray(context.dataSources) && context.dataSources[0]) || {};
const defaultCluster = typeof dataSource.defaultCluster === 'string' ? dataSource.defaultCluster.trim() : '';
const unwrap = (v) => (Array.isArray(v) ? v[0] : v);
// Only this plugin's objects: a selected object can resolve to equivalent objects from
// other plugins (e.g. the same service seen by VictoriaMetrics), whose properties differ.
// Prefer this plugin's objects: a selected object can resolve to, or be merged with,
// equivalent objects from other plugins. Their ids follow the same rules, so fall back to
// all of them when none is from this plugin.
const allScope = Array.isArray(context.config?.scope) ? context.config.scope : [];
const ownScope = allScope.filter((o) => [].concat(o?.sourceName || []).includes('VictoriaLogs'));
const scope = ownScope.length ? ownScope : allScope;
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

const single = false;
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
    // Charts drill down only when a row has a single link, so in chart streams (`single`)
    // node, service and host links are added only when the row has no other link.
    const add = (column, value, id) => {
        if (value && !(single && Object.keys(links).length > 0)) {
            links[`${column}Link`] = value;
            links[`${column}LinkId`] = id;
        }
    };
    const service = first(m['service.name']);
    add('Service', service, service);
    const node = field(m, 'node');
    add('Node', node, `${cluster}/${node}`);
    const host = first(m['host.name']);
    add('Host', host, host);
    const clusterField = field(m, 'cluster');
    if (clusterField && Object.keys(links).length === 0) {
        links.ClusterLink = clusterField;
        links.ClusterLinkId = clusterField;
    }
    return links;
};

// ---- Severity -------------------------------------------------------------------
// Same rules as the LogsQL severity pipe used by the dashboards, so a log shows the same severity
// in a table as in the charts: severity fields first, then the OpenTelemetry severity
// number, then a level token in the message, then error words as a last resort.
const SEVERITY_FIELDS = ['severity_text', 'level', 'severity', 'log.level', 'detected_level', 'loglevel'];
const SEVERITY_MAP = [
    [/^(fatal|panic|emerg|emergency|alert|crit|critical)/i, 'critical'],
    [/^(err|error|severe)/i, 'error'],
    [/^warn/i, 'warning'],
    [/^(info|information|informational|notice)$/i, 'info'],
    [/^(debug|trace|verbose)/i, 'debug'],
    [/^(unspecified|unset|none|unknown|-)$/i, 'unknown']
];
const MESSAGE_RULES = [
    ['critical', /\b(FATAL|PANIC|CRITICAL|CRIT)\b|\b(level|lvl)=(fatal|panic|crit|critical)\b|^\S+\s+(fatal|panic|crit|critical)\s|^\s*crit:/i, /\b(FATAL|PANIC|CRITICAL|CRIT)\b/],
    ['error', /\b(level|lvl)=(error|err|eror)\b|^\S+\s+(error|err)\s|^\s*(fail|error):/i, /\b(ERROR|ERR)\b/],
    ['warning', /\b(level|lvl)=warn(ing)?\b|^\S+\s+warn(ing)?\s|^\s*warn:/i, /\bWARN(ING)?\b/],
    ['info', /\b(level|lvl)=info\b|^\S+\s+info\s|^\s*info:/i, /\bINFO\b/],
    ['debug', /\b(level|lvl)=(debug|dbug|trace)\b|^\S+\s+(debug|trace)\s|^\s*(dbug|trce):/i, /\b(DEBUG|TRACE)\b/]
];
const severityOf = (entry) => {
    const raw = first(...SEVERITY_FIELDS.map((f) => (typeof entry[f] === 'string' ? entry[f].trim() : '')));
    if (raw) {
        const match = SEVERITY_MAP.find(([pattern]) => pattern.test(raw));
        const mapped = match ? match[1] : raw.toLowerCase();
        if (mapped !== 'unknown') {
            return mapped;
        }
    }
    const number = Number(entry.severity_number);
    if (number >= 21 && number <= 24) return 'critical';
    if (number >= 17 && number <= 20) return 'error';
    if (number >= 13 && number <= 16) return 'warning';
    if (number >= 9 && number <= 12) return 'info';
    if (number >= 1 && number <= 8) return 'debug';
    const message = typeof entry._msg === 'string' ? entry._msg : '';
    // Upper-case tokens are matched case-sensitively, the rest case-insensitively.
    const rule = MESSAGE_RULES.find(([, insensitive, upper]) => upper.test(message) || insensitive.test(message));
    if (rule) {
        return rule[0];
    }
    return /\b(error|exception|fatal|panic)\b/i.test(message) ? 'error' : 'unknown';
};

// ---- Rows -----------------------------------------------------------------------
const body = response?.body !== undefined ? response.body : data;
let entries = [];
if (typeof body === 'string') {
    entries = body
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
        .filter((e) => e);
} else if (Array.isArray(body)) {
    entries = body;
} else if (body && typeof body === 'object') {
    entries = [body];
}

// Only the core and link columns, plus any fields named in **Columns**, become columns;
// every other field goes into one `fields` object. Logs carry many sparse fields, and a
// column per field multiplies the response size (each cell is sent for every row).
const promoted = (typeof context.config?.columns === 'string' ? context.config.columns : '')
    .split(',')
    .map((c) => c.trim())
    .filter((c) => c.length > 0);

result = entries
    .map((entry) => {
        const { _time, _msg, _stream, _stream_id, ...rest } = entry;
        const own = {};
        promoted.forEach((c) => {
            if (rest[c] !== undefined) {
                own[c] = rest[c];
            }
        });
        return Object.assign(own, linksFor(entry), {
            timestamp: _time,
            severity: severityOf(entry),
            message: _msg,
            stream: _stream,
            _stream_id,
            fields: rest
        });
    })
    // Sort on the parsed time: timestamps have trimmed trailing zeros, so text order is wrong.
    .sort((a, b) => (Date.parse(b.timestamp) || 0) - (Date.parse(a.timestamp) || 0));
