// One row per project: the monthly hard spend limit and whether it is currently being enforced
const project = context.objects[0];
const unwrap = (v) => (Array.isArray(v) ? v[0] : v);

result = [
    {
        projectId: unwrap(project.rawId),
        // threshold_amount is in cents
        limit: data.threshold_amount / 100,
        currency: data.currency,
        interval: data.interval,
        enforcement: data.enforcement?.status ?? null,
    },
];
