// dataStreams/scripts/graphqlFlatRows.js
// Shared by the GraphQL analytics streams whose columns use plain names (date, requests,
// avgMemory) rather than the dotted names graphqlRows.js produces (dimensions.date,
// sum.requests). Each query selects a single dataset under one account or one zone, and
// names its fields with GraphQL aliases (`requests: count`, `sum{ bytes: edgeResponseBytes }`).
// This script lifts every field out of the dimensions/sum/avg/min/max/quantiles groups
// under its own (aliased) name, so the alias is the column name. Aliases must therefore
// be unique across the groups of one query.
//
// A script rather than pathToData because Cloudflare answers a failed GraphQL query with
// HTTP 200 and an `errors` array, which the declarative errorHandling never sees.

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

// Streams with a `breakdown` parameter interpolate the chosen dimension into the query.
// Its value moves to a stable `breakdown` column (list values joined, empty as "Unknown")
// and the dimension's own column is dropped, since its name changes with the selection.
const breakdownKey = context.config && context.config.breakdown;

const label = (value) => {
    if (Array.isArray(value)) value = value.join(", ");
    return value === undefined || value === null || value === "" ? "Unknown" : String(value);
};

result = rows.map((row) => {
    const out = {};
    Object.keys(row).forEach((key) => {
        const value = row[key];
        if (value !== null && typeof value === "object" && !Array.isArray(value)) {
            Object.keys(value).forEach((field) => {
                out[field] = value[field];
            });
        } else {
            out[key] = value;
        }
    });
    if (breakdownKey) {
        out.breakdown = label(row.dimensions && row.dimensions[breakdownKey]);
        delete out[breakdownKey];
    }
    return out;
});
