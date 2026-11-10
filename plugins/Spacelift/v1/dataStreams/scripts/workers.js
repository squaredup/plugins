// GraphQL reports errors with HTTP 200 and an `errors` array, which errorHandling never sees, so raise them here.
const graphqlErrors = ((data && data.errors) || []).map((e) => e && e.message).filter(Boolean);
if (graphqlErrors.length) {
    throw new Error(graphqlErrors.join("; "));
}

// A pool deleted since the last import comes back as null.
const pool = data && data.data && data.data.workerPool;
const iso = (seconds) => (typeof seconds === "number" && seconds > 0 ? new Date(seconds * 1000).toISOString() : null);

result = ((pool && pool.workers) || []).filter(Boolean).map((w) => ({
    workerId: w.id,
    status: w.status,
    busy: w.busy === true,
    drained: w.drained === true,
    createdAt: iso(w.createdAt),
    availableAt: w.busy ? null : iso(w.availableAt),
    workerPoolId: pool.id,
    workerPoolName: pool.name || pool.id
}));
