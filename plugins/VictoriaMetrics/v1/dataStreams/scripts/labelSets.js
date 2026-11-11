// Turns `count by (<labels>)` results into one row per distinct label combination.
// Each row carries canonical properties (named by `keys`), a stable id built from
// those properties, and a MetricsQL `selector` that matches the object's series in
// every naming convention listed in `aliases` - used by the query stream for scoping.
//
// Labels not listed in `required` are optional (e.g. the cluster). They are matched
// with `=~"<value>|"` so the selector also matches series that lack the label. A
// missing `cluster` falls back to the data source's "Default cluster name", the same
// rule the query stream uses to build drilldown ids, so ids always agree.
//
// `extraLabels` / `extraKeys` add properties that are not part of the id or selector.
const split = (s) => (s || '').split(',').map((x) => x.trim()).filter((x) => x.length > 0);

const labels = split(context.config.labels);
const keys = split(context.config.keys);
const required = split(context.config.required);
const extraLabels = split(context.config.extraLabels);
const extraKeys = split(context.config.extraKeys);
const nameKey = context.config.nameKey || keys[keys.length - 1];
const optional = keys.map((key, i) => !required.includes(labels[i]));
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
    if (label === '-' || !value) {
        return null;
    }
    return optional[i] ? `${label}=~"${escapeValue(escapeRegex(value))}|"` : `${label}="${escapeValue(value)}"`;
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
        props[key] = metric[labels[i]] || (key === 'cluster' ? defaultCluster : '');
    });

    const id = keys.map((key) => props[key]).join('/');
    if (seen.has(id)) {
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

    rows.push(Object.assign({ id, name: props[nameKey] || id, selector }, props));
}

result = rows;
