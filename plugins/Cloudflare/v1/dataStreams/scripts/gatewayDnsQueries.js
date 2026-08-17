// dataStreams/scripts/gatewayDnsQueries.js
// The GraphQL query interpolates {{breakdown}} into the dimensions selection, so the
// key holding the dimension value inside each row's `dimensions` object varies with the
// user-selected breakdown (dimensions.resolverDecision vs dimensions.categoryNames vs ...).
// Normalise it to a stable `breakdown` column regardless of which dimension was chosen.

const dimensionKey = context.config && context.config.breakdown;

const groups =
    (data &&
        data.data &&
        data.data.viewer &&
        data.data.viewer.accounts &&
        data.data.viewer.accounts[0] &&
        data.data.viewer.accounts[0].gatewayResolverQueriesAdaptiveGroups) ||
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
        queryCount: Number(row.count !== undefined && row.count !== null ? row.count : 0) || 0
    };
});
