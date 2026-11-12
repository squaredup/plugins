// Spans are stored as log entries, so objects are discovered the same way as in the
// VictoriaLogs plugin.
// Turns `stats by (<fields>) count()` results into one row per distinct field combination.
// Each row carries canonical properties (named by `keys`), a stable id built from
// those properties, and a LogsQL `selector` that matches the object's logs in every
// field convention listed in `aliases` - used by the query streams for scoping
// (sent as `extra_filters`). The selector is wrapped in parentheses so it can be
// combined with other filters without `or` escaping a time range.
//
// Fields not listed in `required` are optional (e.g. the cluster). A missing `cluster`
// falls back to the data source's "Default cluster name", the same rule the query streams
// use to build drilldown ids, so ids always agree (see `matcher` for how it is matched).
//
// `extraLabels` / `extraKeys` add properties that are not part of the id or selector.
const split = (s) => (s || '').split(',').map((x) => x.trim()).filter((x) => x.length > 0);

const labels = split(context.config.labels);
const keys = split(context.config.keys);
const required = split(context.config.required);
const extraLabels = split(context.config.extraLabels);
const extraKeys = split(context.config.extraKeys);
// `nameKey` may list several properties (e.g. `service,operation`), joined with ' / '.
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

// Spans without a cluster belong to the default cluster, so only an object in the default
// cluster also matches spans without the field; objects in other clusters match it exactly,
// and an object with no cluster at all matches only spans without one (the same rule as the
// VictoriaMetrics and VictoriaLogs plugins).
const matcher = (label, i, value) => {
    if (label === '-') {
        return null;
    }
    if (!optional[i]) {
        return value ? `${quote(label)}:=${quote(value)}` : null;
    }
    if (!value) {
        return `${quote(label)}:=""`;
    }
    return keys[i] === 'cluster' && value === defaultCluster
        ? `${quote(label)}:in(${quote(value)}, "")`
        : `${quote(label)}:=${quote(value)}`;
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
                .join(' ')
        )
        .filter((s) => s.length > 0)
        .map((s) => `(${s})`)
        .join(' or ');

    const name = nameKeys.map((k) => props[k]).filter((v) => v).join(' / ');
    rows.push(Object.assign({ id, name: name || id, selector: `(${selector})` }, props));
}

result = rows;
