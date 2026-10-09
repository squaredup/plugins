// dataStreams/scripts/zonePageShield.js
// The GraphQL query interpolates {{breakdown}} into the dimensions selection, so the
// key holding the dimension value inside each row's `dimensions` object varies with the
// user-selected breakdown (dimensions.resourceType vs dimensions.urlHost vs ...).
// Normalise it to a stable `breakdown` column regardless of which dimension was chosen.
//
// Cloudflare answers a failed GraphQL query (e.g. Page Shield not entitled on this
// zone's plan) with HTTP 200 and a populated top-level `errors` array. A postRequestScript
// bypasses the stream's declarative `errorHandling`, so without this check a genuine
// failure would silently shape to zero rows instead of surfacing as an error.
const graphqlErrors = data && Array.isArray(data.errors) ? data.errors : [];
if (graphqlErrors.length) {
    throw new Error(
        "Cloudflare GraphQL error: " +
            graphqlErrors.map((e) => (e && e.message) || JSON.stringify(e)).join(" | ")
    );
}

const dimensionKey = context.config && context.config.breakdown;

const groups =
    (data &&
        data.data &&
        data.data.viewer &&
        data.data.viewer.zones &&
        data.data.viewer.zones[0] &&
        data.data.viewer.zones[0].pageShieldReportsAdaptiveGroups) ||
    [];

result = groups.map((row) => {
    const rawValue = dimensionKey ? row.dimensions && row.dimensions[dimensionKey] : undefined;
    const label = rawValue === undefined || rawValue === null || rawValue === "" ? "Unknown" : String(rawValue);

    return {
        date: row.dimensions && row.dimensions.date,
        breakdown: label,
        events: Number(row.count !== undefined && row.count !== null ? row.count : 0) || 0
    };
});
