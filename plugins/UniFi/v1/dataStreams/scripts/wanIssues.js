result = data.data.flatMap((s) =>
    Object.entries(s.statistics.wans).flatMap(([name, wan]) =>
        wan.wanIssues.map((issue) => ({
            name,
            ...issue
        }))
    )
);
