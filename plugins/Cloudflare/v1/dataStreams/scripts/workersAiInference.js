// dataStreams/scripts/workersAiInference.js
// The GraphQL query interpolates {{breakdown}} into the dimensions selection, so the
// key holding the breakdown value inside each row's `dimensions` object varies with the
// user-selected breakdown (dimensions.modelId vs dimensions.requestSource vs dimensions.errorCode).
// Normalise it to a stable `breakdown` column regardless of which dimension was chosen, and
// derive an average inference time per request (the API only returns a per-group total).

const dimensionKey = context.config && context.config.breakdown;

const groups =
    (data &&
        data.data &&
        data.data.viewer &&
        data.data.viewer.accounts &&
        data.data.viewer.accounts[0] &&
        data.data.viewer.accounts[0].aiInferenceAdaptiveGroups) ||
    [];

result = groups.map((row) => {
    const rawValue = dimensionKey ? row.dimensions && row.dimensions[dimensionKey] : undefined;
    const label = rawValue === undefined || rawValue === null || rawValue === "" ? "Unknown" : String(rawValue);
    const requests = Number((row.count !== undefined && row.count !== null ? row.count : 0)) || 0;
    const totalDurationMs = Number((row.sum && row.sum.totalInferenceTimeMs) || 0) || 0;

    return {
        date: row.dimensions && row.dimensions.date,
        breakdown: label,
        requests: requests,
        inputTokens: Number((row.sum && row.sum.totalInputTokens) || 0) || 0,
        outputTokens: Number((row.sum && row.sum.totalOutputTokens) || 0) || 0,
        avgDurationMs: requests > 0 ? Math.round((totalDurationMs / requests) * 100) / 100 : 0
    };
});
