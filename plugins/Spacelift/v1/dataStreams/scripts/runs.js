// Shared by Runs (account-wide searchRuns) and Stack Runs (one stack's runsInRange). Both return
// Run objects, so one row shape serves both.
// GraphQL reports errors with HTTP 200 and an `errors` array, which errorHandling never sees, so raise them here.
const graphqlErrors = ((data && data.errors) || []).map((e) => e && e.message).filter(Boolean);
const root = (data && data.data) || {};

let items;
if (root.searchRuns) {
    // Module test runs come back too; they have no Stack object to link to.
    items = (root.searchRuns.edges || [])
        .map((edge) => edge && edge.node)
        .filter((node) => node && node.run && node.stack && !node.isModule)
        .map((node) => ({ run: node.run, stack: node.stack }));
} else if (root.stack) {
    items = (root.stack.runsInRange || []).filter(Boolean).map((run) => ({ run, stack: root.stack }));
} else if (root.stack === null && !graphqlErrors.length) {
    // The stack was deleted after the last import.
    items = [];
} else {
    throw new Error(graphqlErrors.join("; ") || "Spacelift returned no run data");
}

const iso = (seconds) => (typeof seconds === "number" && seconds > 0 ? new Date(seconds * 1000).toISOString() : null);
const count = (value) => (typeof value === "number" ? value : null);
const accountUrl = String(((context.dataSources || [])[0] || {}).accountUrl || "")
    .trim()
    .replace(/\/+$/, "");

result = items.map(({ run, stack }) => {
    const commit = run.commit || {};
    const delta = run.delta || {};
    return {
        runId: run.id,
        title: run.title || null,
        stackId: stack.id,
        stackName: stack.name || stack.id,
        type: run.type,
        state: run.state,
        createdAt: iso(run.createdAt),
        updatedAt: iso(run.updatedAt),
        // A finished run's last update is when it reached its final state.
        duration: run.finished && run.updatedAt >= run.createdAt ? run.updatedAt - run.createdAt : null,
        triggeredBy: run.triggeredBy || null,
        branch: run.branch || null,
        commitHash: commit.hash || null,
        commitAuthor: commit.authorName || commit.authorLogin || null,
        driftDetection: run.driftDetection === true,
        needsApproval: run.needsApproval === true,
        resourcesAdded: count(delta.addCount),
        resourcesChanged: count(delta.changeCount),
        resourcesDeleted: count(delta.deleteCount),
        url: accountUrl ? `${accountUrl}/stack/${encodeURIComponent(stack.id)}/run/${encodeURIComponent(run.id)}` : null
    };
});
