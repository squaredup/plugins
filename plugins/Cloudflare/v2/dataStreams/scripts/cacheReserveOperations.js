// Cloudflare answers HTTP 200 even when the GraphQL query failed, and a
// postRequestScript bypasses the stream's declarative errorHandling entirely,
// so the error is raised here or it would be swallowed into an empty result.
if (data && data.errors && data.errors.length) {
    throw new Error("Cloudflare GraphQL error: " + data.errors[0].message);
}

// dataStreams/scripts/cacheReserveOperations.js
// The GraphQL query interpolates {{breakdown}} into the dimensions selection, so the
// key holding the dimension value inside each row's `dimensions` object varies with the
// user-selected breakdown (dimensions.operationClass vs dimensions.actionStatus).
// Normalise it to a stable `breakdown` column regardless of which dimension was chosen.

const dimensionKey = context.config && context.config.breakdown;

const groups =
    (data &&
        data.data &&
        data.data.viewer &&
        data.data.viewer.zones &&
        data.data.viewer.zones[0] &&
        data.data.viewer.zones[0].cacheReserveOperationsAdaptiveGroups) ||
    [];

result = groups.map((row) => {
    const rawValue = dimensionKey ? row.dimensions && row.dimensions[dimensionKey] : undefined;
    const label = rawValue === undefined || rawValue === null || rawValue === "" ? "Unknown" : String(rawValue);

    return {
        datetime: row.dimensions && row.dimensions.datetime,
        breakdown: label,
        operationCount: Number((row.sum && row.sum.requests !== undefined ? row.sum.requests : 0)) || 0
    };
});
