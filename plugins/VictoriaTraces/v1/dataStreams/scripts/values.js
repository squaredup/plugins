// Response body: { values: [{ value, hits }] }
// The limit is applied here rather than by the API: VictoriaLogs returns arbitrary values
// without hit counts when given a limit, so we sort by hits and keep the top N instead.
const values = Array.isArray(data?.values) ? data.values : [];
const limit = Number(context.config?.limit) > 0 ? Number(context.config.limit) : undefined;
result = values
    .map((v) => ({ label: v.value, value: v.value, hits: Number(v.hits) }))
    .sort((a, b) => b.hits - a.hits)
    .slice(0, limit);
