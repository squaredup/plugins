// Flatten the nested findings array so each finding is a row.
// last24hours is narrower than the date-only API filter, so trim by merge time
const start = Date.parse(context.timeframe.start);
const end = Date.parse(context.timeframe.end);
const inWindow = (mergedAt) => {
    const t = Date.parse(mergedAt);
    return Number.isNaN(t) || (t >= start && t <= end);
};

result = (data.data || [])
    .filter((pr) => inWindow(pr.merged_at))
    .flatMap((pr) =>
        (pr.coderabbit_comments || []).map((c) => ({
            commentUrl: c.url,
            prUrl: pr.pr_url,
            // The url shape's label can't read computed columns, so the number is derived here
            prNumber: Number(String(pr.pr_url || "").split("/").pop()) || null,
            severityKey: c.severity,
            categoryKey: c.category,
            accepted: c.accepted === true,
            merged_at: pr.merged_at,
            repository_id: pr.repository_id,
            author_id: pr.author_id,
        })),
    );
