// GraphQL reports errors with HTTP 200 and an `errors` array, which errorHandling never sees, so raise them here.
const graphqlErrors = ((data && data.errors) || []).map((e) => e && e.message).filter(Boolean);
const stacks = data && data.data && data.data.stacks;
if (!Array.isArray(stacks)) {
    throw new Error(graphqlErrors.join("; ") || "Spacelift returned no stack list");
}

const unwrap = (v) => (Array.isArray(v) ? v[0] : v);
const selected = (name) =>
    new Set(((context.config && context.config[name]) || []).map((o) => unwrap(o.rawId)).filter(Boolean));
const stackFilter = selected("stack");
const poolFilter = selected("workerPool");

const iso = (seconds) => (typeof seconds === "number" && seconds > 0 ? new Date(seconds * 1000).toISOString() : null);
const accountUrl = String(((context.dataSources || [])[0] || {}).accountUrl || "")
    .trim()
    .replace(/\/+$/, "");

// A stack with no worker pool of its own runs on Spacelift's public pool, imported as the
// "public" Worker Pool object.
const PUBLIC_POOL = { id: "public", name: "Public worker pool" };

// Disabled stacks are switched off on purpose, so they don't count against health.
const healthOf = (s) => {
    if (s.isDisabled) return "unmonitored";
    if (s.state === "FAILED") return "error";
    if (s.state === "UNCONFIRMED" || s.state === "STOPPED" || s.isDrifted) return "warning";
    if (s.state === "NONE") return "unknown";
    return "success";
};

result = stacks
    .filter((s) => s && !s.deleted)
    .map((s) => {
        const pool = s.workerPool || PUBLIC_POOL;
        const commit = s.trackedCommit || {};
        return {
            stackId: s.id,
            name: s.name || s.id,
            description: s.description || null,
            health: healthOf(s),
            state: s.state,
            isDrifted: s.isDrifted === true,
            needsApproval: s.needsApproval === true,
            isLocked: Boolean(s.lockedBy),
            lockedBy: s.lockedBy || null,
            lockedAt: iso(s.lockedAt),
            isDisabled: s.isDisabled === true,
            space: (s.spaceDetails && s.spaceDetails.name) || s.space,
            spaceId: s.space,
            vendor: ((s.vendorConfig && s.vendorConfig.__typename) || "").replace(/^StackConfigVendor/, "") || null,
            resourceCount: typeof s.entityCount === "number" ? s.entityCount : null,
            stateSetAt: iso(s.stateSetAt),
            lastApplyAt: iso(s.lastApplyAt),
            repository: s.repository || null,
            branch: s.branch || null,
            projectRoot: s.projectRoot || null,
            vcsProvider: s.provider || null,
            commitHash: commit.hash || null,
            commitAuthor: commit.authorName || null,
            workerPoolId: pool.id,
            workerPoolName: pool.name,
            labels: Array.isArray(s.labels) ? s.labels : [],
            autodeploy: s.autodeploy === true,
            administrative: s.administrative === true,
            url: accountUrl ? `${accountUrl}/stack/${encodeURIComponent(s.id)}` : null
        };
    })
    .filter((row) => !stackFilter.size || stackFilter.has(row.stackId))
    .filter((row) => !poolFilter.size || poolFilter.has(row.workerPoolId));
