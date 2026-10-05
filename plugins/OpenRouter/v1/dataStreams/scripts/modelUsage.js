// Sums analytics rows per model. Analytics reports models by canonical slug
// (e.g. z-ai/glm-5.3-flash-20260826), not by Model object id; dashboards join
// on the Model objects' canonical_slug property to resolve names and drilldowns.
const body = data?.data ?? {};

if (body.metadata?.truncated) {
    api.report.warning('Results were truncated by OpenRouter; narrow the timeframe');
}

const totals = new Map();
for (const row of body.data ?? []) {
    const slug = row.model;
    if (!slug) continue;

    const total = totals.get(slug) ?? { spend: 0, requests: 0, promptTokens: 0, completionTokens: 0 };
    total.spend += Number(row.total_usage ?? 0);
    total.requests += Number(row.request_count ?? 0);
    total.promptTokens += Number(row.tokens_prompt ?? 0);
    total.completionTokens += Number(row.tokens_completion ?? 0);
    totals.set(slug, total);
}

result = [...totals].map(([slug, total]) => ({
    slug,
    ...total,
    costPerRequest: total.requests ? total.spend / total.requests : null,
}));
