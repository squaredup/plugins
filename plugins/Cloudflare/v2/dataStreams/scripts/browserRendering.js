// Cloudflare answers HTTP 200 even when the GraphQL query failed, and a
// postRequestScript bypasses the stream's declarative errorHandling entirely,
// so the error is raised here or it would be swallowed into an empty result.
if (data && data.errors && data.errors.length) {
    throw new Error("Cloudflare GraphQL error: " + data.errors[0].message);
}

// dataStreams/scripts/browserRendering.js
// The GraphQL query interpolates {{breakdown}} into the dimensions selection, so the
// key holding the dimension value inside each row's `dimensions` object varies with the
// user-selected breakdown (dimensions.clientLibrary vs dimensions.recordingMode).
// Normalise it to a stable `breakdown` column regardless of which dimension was chosen.
//
// Rows are grouped by date + sessionId (+ the chosen breakdown dimension), so each row's
// min/max aggregates collapse to that one session's actual start/end time - used to derive
// a genuine per-session duration, which the API has no single field for.

const dimensionKey = context.config && context.config.breakdown;

const groups =
    (data &&
        data.data &&
        data.data.viewer &&
        data.data.viewer.accounts &&
        data.data.viewer.accounts[0] &&
        data.data.viewer.accounts[0].browserRenderingEventsAdaptiveGroups) ||
    [];

result = groups.map((row) => {
    const dims = row.dimensions || {};
    const rawValue = dimensionKey ? dims[dimensionKey] : undefined;
    const breakdown = rawValue === undefined || rawValue === null || rawValue === "" ? "Unknown" : String(rawValue);

    const startTime = row.min && row.min.earliestBrowserStartTime;
    const endTime = row.max && row.max.latestBrowserEndTime;
    const durationMs =
        startTime && endTime ? new Date(endTime).getTime() - new Date(startTime).getTime() : null;

    return {
        date: dims.date,
        sessionId: dims.sessionId,
        breakdown: breakdown,
        count: Number(row.count !== undefined && row.count !== null ? row.count : 0) || 0,
        durationMs: durationMs,
        avgConcurrentSessions: Number((row.avg && row.avg.avgConcurrentSessions) || 0) || 0,
        startTime: startTime,
        endTime: endTime
    };
});
