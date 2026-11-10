// GraphQL reports errors with HTTP 200 and an `errors` array, which errorHandling never sees, so raise them here.
// The public pool can be missing on its own (self-hosted Spacelift has none, and some releases
// restrict it for API keys), so only a missing private pool list is treated as a failure.
const graphqlErrors = ((data && data.errors) || []).map((e) => e && e.message).filter(Boolean);
const root = (data && data.data) || {};
if (!Array.isArray(root.workerPools)) {
    throw new Error(graphqlErrors.join("; ") || "Spacelift returned no worker pool list");
}

const unwrap = (v) => (Array.isArray(v) ? v[0] : v);
const poolFilter = new Set(
    ((context.config && context.config.workerPool) || []).map((o) => unwrap(o.rawId)).filter(Boolean)
);
const percent = (part, whole) => (whole > 0 ? (part / whole) * 100 : null);

const rows = root.workerPools.map((p) => {
    const workers = Array.isArray(p.workers) ? p.workers : [];
    const drained = workers.filter((w) => w && w.drained).length;
    const idle = workers.filter((w) => w && !w.busy && !w.drained).length;
    const capacity = (p.workersCount || 0) - drained;
    let health = "success";
    if (p.pendingRuns > 0 && capacity <= 0) health = "error";
    else if (p.pendingRuns > 0 && idle === 0) health = "warning";
    return {
        workerPoolId: p.id,
        name: p.name || p.id,
        poolType: "Private",
        description: p.description || null,
        health,
        utilization: percent(p.busyWorkers || 0, capacity),
        pendingRuns: p.pendingRuns,
        busyWorkers: p.busyWorkers,
        idleWorkers: idle,
        drainedWorkers: drained,
        workers: p.workersCount,
        parallelism: null,
        space: (p.spaceDetails && p.spaceDetails.name) || p.space,
        spaceId: p.space,
        labels: Array.isArray(p.labels) ? p.labels : []
    };
});

const pub = root.publicWorkerPool;
if (pub) {
    rows.push({
        workerPoolId: "public",
        name: "Public worker pool",
        poolType: "Public",
        description: null,
        health: pub.pendingRuns > 0 && pub.busyWorkers >= pub.parallelism ? "warning" : "success",
        utilization: percent(pub.busyWorkers || 0, pub.parallelism),
        pendingRuns: pub.pendingRuns,
        busyWorkers: pub.busyWorkers,
        idleWorkers: Math.max(0, (pub.parallelism || 0) - (pub.busyWorkers || 0)),
        drainedWorkers: null,
        workers: null,
        parallelism: pub.parallelism,
        space: null,
        spaceId: null,
        labels: []
    });
}

result = rows.filter((row) => !poolFilter.size || poolFilter.has(row.workerPoolId));
