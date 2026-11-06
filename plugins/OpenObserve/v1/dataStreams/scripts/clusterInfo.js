result = Object.entries(data.regions || {}).flatMap(([region, nodes]) =>
    Object.entries(nodes).map(([node, info]) => ({
        region,
        node,
        pendingJobs: info.pending_jobs,
    }))
);
