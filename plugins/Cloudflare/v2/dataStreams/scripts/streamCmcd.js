// Cloudflare answers HTTP 200 even when the GraphQL query failed, and a
// postRequestScript bypasses the stream's declarative errorHandling entirely,
// so the error is raised here or it would be swallowed into an empty result.
if (data && data.errors && data.errors.length) {
    throw new Error("Cloudflare GraphQL error: " + data.errors[0].message);
}

// dataStreams/scripts/streamCmcd.js
// The GraphQL query interpolates {{breakdown}} into the dimensions selection, so the
// key holding the dimension value inside each row's `dimensions` object varies with the
// user-selected breakdown (dimensions.country vs dimensions.resolution vs dimensions.streamType).
// Normalise it to a stable `breakdown` column regardless of which dimension was chosen.

const dimensionKey = context.config && context.config.breakdown;

const groups =
    (data &&
        data.data &&
        data.data.viewer &&
        data.data.viewer.accounts &&
        data.data.viewer.accounts[0] &&
        data.data.viewer.accounts[0].streamCMCDAdaptiveGroups) ||
    [];

result = groups.map((row) => {
    const rawValue = dimensionKey ? row.dimensions && row.dimensions[dimensionKey] : undefined;
    const label = rawValue === undefined || rawValue === null || rawValue === "" ? "Unknown" : String(rawValue);
    const avg = row.avg || {};

    return {
        date: row.dimensions && row.dimensions.date,
        breakdown: label,
        sampleCount: Number(row.count !== undefined && row.count !== null ? row.count : 0) || 0,
        avgBufferingDurationMs: Number(avg.bufferStarvationDuration) || 0,
        avgStartupBufferingDurationMs: Number(avg.initialBufferStarvationDuration) || 0,
        avgEncodedBitrate: Number(avg.encodedBitrate) || 0,
    };
});
