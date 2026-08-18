// Cloudflare answers HTTP 200 even when the GraphQL query failed, and a
// postRequestScript bypasses the stream's declarative errorHandling entirely,
// so the error is raised here or it would be swallowed into an empty result.
if (data && data.errors && data.errors.length) {
    throw new Error("Cloudflare GraphQL error: " + data.errors[0].message);
}

// dataStreams/scripts/dnsFirewallAnalytics.js
// The GraphQL query interpolates {{breakdown}} into the dimensions selection, so the
// key holding the dimension value inside each row's `dimensions` object varies with the
// user-selected breakdown (dimensions.responseCode vs dimensions.queryType vs ...).
// Normalise it to a stable `breakdown` column regardless of which dimension was chosen.
// processingTimeUsP50 is reported by Cloudflare in microseconds; convert to milliseconds.
//
// Cloudflare answers a failed GraphQL query with HTTP 200 and a populated top-level
// `errors` array. A postRequestScript bypasses the stream's declarative `errorHandling`,
// so without this check a genuine failure would silently shape to zero rows instead of
// surfacing as an error.
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
        data.data.viewer.accounts &&
        data.data.viewer.accounts[0] &&
        data.data.viewer.accounts[0].dnsFirewallAnalyticsAdaptiveGroups) ||
    [];

result = groups.map((row) => {
    const rawValue = dimensionKey ? row.dimensions && row.dimensions[dimensionKey] : undefined;
    const label = rawValue === undefined || rawValue === null || rawValue === "" ? "Unknown" : String(rawValue);

    return {
        date: row.dimensions && row.dimensions.date,
        breakdown: label,
        queries: Number(row.count !== undefined && row.count !== null ? row.count : 0) || 0,
        medianProcessingTimeMs: Number((row.quantiles && row.quantiles.processingTimeUsP50) || 0) / 1000
    };
});
