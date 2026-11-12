// Turns `stats by (<fields>) count()` results into one row per distinct field combination.
// Each row carries canonical properties (named by `keys`), a stable id built from
// those properties, and a LogsQL `selector` that matches the object's logs in every
// field convention listed in `aliases` - used by the query streams for scoping
// (sent as `extra_filters`). The selector is wrapped in parentheses so it can be
// combined with other filters without `or` escaping a time range.
//
// Fields not listed in `required` are optional (e.g. the cluster). They are matched
// with `in("<value>", "")` so the selector also matches logs that lack the field. A
// missing `cluster` falls back to the data source's "Default cluster name", the same
// rule the query streams use to build drilldown ids, so ids always agree.
//
// `extraLabels` / `extraKeys` add properties that are not part of the id or selector.
const split = (s) => (s || '').split(',').map((x) => x.trim()).filter((x) => x.length > 0);

const labels = split(context.config.labels);
const keys = split(context.config.keys);
const required = split(context.config.required);
const extraLabels = split(context.config.extraLabels);
const extraKeys = split(context.config.extraKeys);
// `nameKey` may list several properties (e.g. `cluster,namespace`), joined with ' / ' so
// objects with common names (`default`, `istio-proxy`) can be told apart.
const nameKeys = split(context.config.nameKey || keys[keys.length - 1]);
const optional = keys.map((key, i) => !required.includes(labels[i]));
const forms = [labels].concat(
    (context.config.aliases || '')
        .split('|')
        .map(split)
        .filter((form) => form.length === keys.length)
);

const dataSource = (Array.isArray(context.dataSources) && context.dataSources[0]) || {};
const defaultCluster = typeof dataSource.defaultCluster === 'string' ? dataSource.defaultCluster.trim() : '';

const quote = (v) => JSON.stringify(String(v));

const matcher = (label, i, value) => {
    if (label === '-' || !value) {
        return null;
    }
    return optional[i] ? `${quote(label)}:in(${quote(value)}, "")` : `${quote(label)}:=${quote(value)}`;
};

// Response body: { status, data: { resultType, result: [{ metric, value }] } }
// Most logs first, so when several rows share an id (e.g. a service seen with two
// `service.namespace` values) the kept row, and its extra properties, are stable.
const results = (Array.isArray(data?.data?.result) ? data.data.result : [])
    .slice()
    .sort((a, b) => Number(b.value?.[1] || 0) - Number(a.value?.[1] || 0));

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
                .join(' ')
        )
        .filter((s) => s.length > 0)
        .map((s) => `(${s})`)
        .join(' or ');

    const name = nameKeys.map((k) => props[k]).filter((v) => v).join(' / ');
    rows.push(Object.assign({ id, name: name || id, selector: `(${selector})` }, props));
}

result = rows;
