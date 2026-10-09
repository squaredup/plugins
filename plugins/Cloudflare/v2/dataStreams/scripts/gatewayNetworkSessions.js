// Cloudflare answers HTTP 200 even when the GraphQL query failed, and a
// postRequestScript bypasses the stream's declarative errorHandling entirely,
// so the error is raised here or it would be swallowed into an empty result.
if (data && data.errors && data.errors.length) {
    throw new Error("Cloudflare GraphQL error: " + data.errors[0].message);
}

// dataStreams/scripts/gatewayNetworkSessions.js
// The GraphQL query interpolates {{breakdown}} into the dimensions selection, so the
// key holding the dimension value inside each row's `dimensions` object varies with the
// user-selected breakdown (dimensions.action vs dimensions.destinationIp vs ...).
// Normalise it to a stable `breakdown` column regardless of which dimension was chosen.

const dimensionKey = context.config && context.config.breakdown;

const groups =
    (data &&
        data.data &&
        data.data.viewer &&
        data.data.viewer.accounts &&
        data.data.viewer.accounts[0] &&
        data.data.viewer.accounts[0].gatewayL4SessionsAdaptiveGroups) ||
    [];

result = groups.map((row) => {
    const rawValue = dimensionKey ? row.dimensions && row.dimensions[dimensionKey] : undefined;
    const label =
        rawValue === undefined || rawValue === null || rawValue === "" || (Array.isArray(rawValue) && rawValue.length === 0)
            ? "Unknown"
            : Array.isArray(rawValue)
            ? rawValue.join(", ")
            : String(rawValue);

    return {
        date: row.dimensions && row.dimensions.date,
        breakdown: label,
        sessionCount: Number(row.count !== undefined && row.count !== null ? row.count : 0) || 0
    };
});
