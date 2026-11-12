// Turns `count by (<labels>)` results into one row per distinct label combination.
// Each row carries canonical properties (named by `keys`), a stable id built from
// those properties, and a MetricsQL `selector` that matches the object's series in
// every naming convention listed in `aliases` - used by the query stream for scoping.
//
// Labels not listed in `required` are optional (e.g. the cluster). A missing `cluster`
// falls back to the data source's "Default cluster name", the same rule the query
// stream uses to build drilldown ids, so ids always agree. Because unlabelled series
// belong to the default cluster, only an object in the default cluster also matches
// series without the label (`=~"<value>|"`); objects in other clusters match the label
// exactly, and an object with no cluster at all matches only unlabelled series.
//
// A label may list alternatives separated by `/` (e.g. `cluster/k8s.cluster.name`); the
// first non-empty one is used, so a cluster carried under another convention isn't lost.
//
// `nameKey` may list several properties (e.g. `cluster,namespace`), joined with ' / ' so
// objects with common names (`default`, `istio-proxy`) can be told apart.
//
// `extraLabels` / `extraKeys` add properties that are not part of the id or selector.
const split = (s) => (s || '').split(',').map((x) => x.trim()).filter((x) => x.length > 0);

const labels = split(context.config.labels);
const keys = split(context.config.keys);
const required = split(context.config.required);
const extraLabels = split(context.config.extraLabels);
const extraKeys = split(context.config.extraKeys);
const nameKeys = split(context.config.nameKey || keys[keys.length - 1]);
const alternatives = (label) => label.split('/').map((l) => l.trim()).filter((l) => l.length > 0);
const optional = keys.map((key, i) => !alternatives(labels[i]).some((l) => required.includes(l)));
const forms = [labels].concat(
    (context.config.aliases || '')
        .split('|')
        .map(split)
        .filter((form) => form.length === keys.length)
);

const dataSource = (Array.isArray(context.dataSources) && context.dataSources[0]) || {};
const defaultCluster = typeof dataSource.defaultCluster === 'string' ? dataSource.defaultCluster.trim() : '';

const escapeValue = (v) => String(v).replace(/\\/g, '\\\\').replace(/"/g, '\\"');
const escapeRegex = (v) => String(v).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const matcher = (label, i, value) => {
    const name = alternatives(label)[0];
    if (!name || name === '-') {
        return null;
    }
    if (keys[i] === 'cluster' && value && value === defaultCluster) {
        return `${name}=~"${escapeValue(escapeRegex(value))}|"`;
    }
    if (!value) {
        return optional[i] ? `${name}=""` : null;
    }
    return `${name}="${escapeValue(value)}"`;
};

// Response body: { status, data: { resultType, result: [{ metric, value }] } }
const results = Array.isArray(data?.data?.result) ? data.data.result : [];

const rows = [];
const seen = new Set();

for (const series of results) {
    const metric = series.metric || {};
    if (!required.every((label) => metric[label])) {
        continue;
    }

    const props = {};
    keys.forEach((key, i) => {
        const value = alternatives(labels[i]).map((l) => metric[l]).find((v) => v);
        props[key] = value || (key === 'cluster' ? defaultCluster : '');
    });

    const id = keys.map((key) => props[key]).join('/');
    if (keys.every((key) => !props[key]) || seen.has(id)) {
        continue;
    }
    seen.add(id);

    extraKeys.forEach((key, i) => {
        if (extraLabels[i] && metric[extraLabels[i]]) {
            props[key] = metric[extraLabels[i]];
        }
    });

    const selector = forms
        .map((form) =>
            form
                .map((label, i) => matcher(label, i, props[keys[i]]))
                .filter((m) => m !== null)
                .join(',')
        )
        .filter((s) => s.length > 0)
        .join(' or ');

    const name = nameKeys.map((k) => props[k]).filter((v) => v).join(' / ');
    rows.push(Object.assign({ id, name: name || id, selector }, props));
}

result = rows;
