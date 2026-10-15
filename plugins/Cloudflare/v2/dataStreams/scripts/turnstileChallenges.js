// dataStreams/scripts/turnstileChallenges.js
// The GraphQL query interpolates {{breakdown}} into the dimensions selection, so the
// key holding the breakdown value inside each row's `dimensions` object varies with the
// user-selected breakdown (dimensions.eventType vs dimensions.action).
// Normalise it to a stable `breakdown` column regardless of which dimension was chosen.
//
// Cloudflare answers a failed GraphQL query with HTTP 200 and a populated `errors` array,
// so the request never looks like a failure and the stream's `errorHandling` does not
// reliably fire on it. Check for it explicitly so a broken/over-wide query surfaces as a
// real error instead of silently shaping to zero rows.
const graphqlErrors = (data && data.errors) || [];
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
        data.data.viewer.accounts[0].turnstileAdaptiveGroups) ||
    [];

result = groups.map((row) => {
    const rawValue = dimensionKey ? row.dimensions && row.dimensions[dimensionKey] : undefined;
    const label = rawValue === undefined || rawValue === null || rawValue === "" ? "Unknown" : String(rawValue);

    return {
        date: row.dimensions && row.dimensions.date,
        breakdown: label,
        challenges: Number((row.count !== undefined && row.count !== null ? row.count : 0)) || 0
    };
});
