// Gateway ids are only unique within an account, so the account id is prefixed
// onto the id to form a globally-unique sourceId. Field names are written
// defensively: no AI Gateway exists in the test account, so the response shape
// is taken from Cloudflare's docs rather than observed.
const accountId =
    (context.objects && context.objects[0] && context.objects[0].rawId) || "";

result = ((data && data.result) || []).map((g) => ({
    sourceId: `${accountId}:${g.id || g.name}`,
    gatewayName: g.id || g.name || "",
    accountId: accountId,
    cacheTtl: typeof g.cache_ttl === "number" ? g.cache_ttl : null,
    rateLimitingLimit:
        typeof g.rate_limiting_limit === "number" ? g.rate_limiting_limit : null,
    collectLogs: Boolean(g.collect_logs),
    createdOn: g.created_at || g.created_on,
}));
