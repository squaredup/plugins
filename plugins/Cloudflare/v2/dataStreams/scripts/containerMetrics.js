// Cloudflare answers HTTP 200 even when the GraphQL query failed, and a
// postRequestScript bypasses the stream's declarative errorHandling entirely,
// so the error is raised here or it would be swallowed into an empty result.
if (data && data.errors && data.errors.length) {
    throw new Error("Cloudflare GraphQL error: " + data.errors[0].message);
}

// dataStreams/scripts/containerMetrics.js
// The GraphQL query interpolates {{breakdown}} into the dimensions selection, so the
// key holding the dimension value inside each row's `dimensions` object varies with the
// user-selected breakdown (dimensions.region vs dimensions.location vs dimensions.procType).
// Normalise it to a stable `breakdown` column regardless of which dimension was chosen.

const dimensionKey = context.config && context.config.breakdown;

const groups =
    (data &&
        data.data &&
        data.data.viewer &&
        data.data.viewer.accounts &&
        data.data.viewer.accounts[0] &&
        data.data.viewer.accounts[0].containersMetricsAdaptiveGroups) ||
    [];

result = groups.map((row) => {
    const dims = row.dimensions || {};
    const rawValue = dimensionKey ? dims[dimensionKey] : undefined;
    const breakdown = rawValue === undefined || rawValue === null || rawValue === "" ? "Unknown" : String(rawValue);
    const avg = row.avg || {};
    const sum = row.sum || {};

    return {
        date: dims.date,
        breakdown: breakdown,
        count: Number(row.count !== undefined && row.count !== null ? row.count : 0) || 0,
        avgCpuUtilization: Number(avg.cpuUtilization || 0) || 0,
        avgMemory: Number(avg.memory || 0) || 0,
        avgContainerUptimeMs: Number(avg.containerUptime || 0) || 0,
        sumRxBytes: Number(sum.rxBytes || 0) || 0,
        sumTxBytes: Number(sum.txBytes || 0) || 0
    };
});
