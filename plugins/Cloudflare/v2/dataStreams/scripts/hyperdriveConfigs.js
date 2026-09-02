// Flattens the nested origin/caching objects and stamps the account id from the
// scoped object so the Hyperdrive analytics stream can build its query.
const accountId =
    (context.objects && context.objects[0] && context.objects[0].rawId) || "";

result = ((data && data.result) || []).map((cfg) => {
    const origin = cfg.origin || {};
    const caching = cfg.caching || {};
    return {
        sourceId: cfg.id,
        configName: cfg.name || cfg.id,
        accountId: accountId,
        database: origin.database || "",
        host: origin.host || "",
        scheme: origin.scheme || "",
        cachingDisabled: Boolean(caching.disabled),
    };
});
