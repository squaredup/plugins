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
    // Turnstile analytics look back 7 days on the Free plan and 30 on Enterprise, so the
    // stream offers Last 30 days. Name the plan limit when it rejects one. String methods
    // rather than a regex: backslash escapes do not survive into the deployed script.
    const message = (graphqlErrors[0] && graphqlErrors[0].message) || "";
    const marker = "cannot request a time range wider than";
    const at = message.indexOf(marker);
    if (at >= 0) {
        const limit = message.slice(at + marker.length).trim().split(" ")[0].split(",")[0];
        throw new Error(
            "Cloudflare's Turnstile plan for this account limits analytics to a range of " +
                limit +
                ". Choose a shorter timeframe - Enterprise Turnstile allows up to 30 days. (" +
                message +
                ")"
        );
    }
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
