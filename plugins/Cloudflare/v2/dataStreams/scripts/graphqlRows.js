// dataStreams/scripts/graphqlRows.js
// Shared by the GraphQL analytics streams that need no shaping of their own. Each of
// those queries selects a single dataset under one account or one zone, so the rows are
// the one array found at data.viewer.<accounts|zones>[0].<dataset>.
//
// A script rather than pathToData because Cloudflare answers a failed GraphQL query with
// HTTP 200 and an `errors` array, which the declarative errorHandling never sees: the
// tile would show no data instead of the reason (an unentitled feature, or a timeframe
// wider than the plan allows).
//
// Rows are flattened to dotted column names (sum.requests, dimensions.date) exactly as
// expandInnerObjects did, so the streams' metadata and dashboards are unchanged.

const body = data || {};

const errors = Array.isArray(body.errors) ? body.errors : [];
if (errors.length) {
    api.report.error(
        "Cloudflare GraphQL error: " +
            errors.map((e) => (e && e.message) || JSON.stringify(e)).join(" | ")
    );
}

const viewer = (body.data && body.data.viewer) || {};
const scope = (viewer.accounts || viewer.zones || [])[0] || {};
const rows = Object.keys(scope)
    .map((key) => scope[key])
    .find((value) => Array.isArray(value)) || [];

const flatten = (value, prefix, target) => {
    Object.keys(value).forEach((key) => {
        const item = value[key];
        const name = prefix ? prefix + "." + key : key;
        if (item !== null && typeof item === "object" && !Array.isArray(item)) {
            flatten(item, name, target);
        } else {
            target[name] = item;
        }
    });
    return target;
};

// Streams with a `breakdown` parameter interpolate the chosen dimension into the query,
// so its column name varies (dimensions.hostname, dimensions.cacheStatus, ...). Copy it
// to a stable `breakdown` column for tiles to group on.
const breakdownKey = context.config && context.config.breakdown;

result = rows.map((row) => {
    const flat = flatten(row, "", {});
    if (breakdownKey) {
        const value = row.dimensions && row.dimensions[breakdownKey];
        flat.breakdown = value === undefined || value === null || value === "" ? "Unknown" : String(value);
    }
    return flat;
});
