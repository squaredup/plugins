// Collapses the nested origins array to a count and stamps the account id from
// the scoped object onto every row.
// Note: the list pools endpoint does not return a "healthy" field (Cloudflare's
// Pool schema has no such property here - health comes from the separate
// /pools/{id}/health endpoint, see the loadBalancerPoolHealth stream), so no
// healthy column is produced from this stream to avoid a misleading always-false value.
const accountId =
    (context.objects && context.objects[0] && context.objects[0].rawId) || "";

result = ((data && data.result) || []).map((pool) => ({
    sourceId: pool.id,
    poolName: pool.name,
    accountId: accountId,
    enabled: Boolean(pool.enabled),
    originCount: (pool.origins || []).length,
    minimumOrigins:
        typeof pool.minimum_origins === "number" ? pool.minimum_origins : null,
    monitorId: pool.monitor || "",
    createdOn: pool.created_on,
    modifiedOn: pool.modified_on,
}));
