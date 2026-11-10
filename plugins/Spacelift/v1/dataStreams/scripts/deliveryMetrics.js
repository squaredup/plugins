// GraphQL reports errors with HTTP 200 and an `errors` array, which errorHandling never sees, so raise them here.
const graphqlErrors = ((data && data.errors) || []).map((e) => e && e.message).filter(Boolean);
const metrics = data && data.data && data.data.metricsRange;
if (!metrics && graphqlErrors.length) {
    throw new Error(graphqlErrors.join("; "));
}

// Spacelift returns each metric as its own daily series; join them into one row per day.
const SERIES = {
    numberOfDeploymentsRange: "deployments",
    changeFailureRateRange: "changeFailureRate",
    averageLeadTimeForChangesRange: "averageLeadTime",
    medianLeadTimeForChangesRange: "medianLeadTime",
    averageTimeToRecoveryRange: "averageTimeToRecovery",
    medianTimeToRecoveryRange: "medianTimeToRecovery"
};

const days = new Map();
for (const [field, column] of Object.entries(SERIES)) {
    for (const point of (metrics && metrics[field]) || []) {
        if (!point || typeof point.timestamp !== "number") continue;
        if (!days.has(point.timestamp)) {
            const row = { date: new Date(point.timestamp * 1000).toISOString() };
            for (const name of Object.values(SERIES)) row[name] = null;
            days.set(point.timestamp, row);
        }
        days.get(point.timestamp)[column] = typeof point.value === "number" ? point.value : null;
    }
}

result = [...days.keys()].sort((a, b) => a - b).map((timestamp) => days.get(timestamp));
