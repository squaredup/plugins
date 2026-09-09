// Index names are only unique within an account, so the account id from the
// scoped object is prefixed onto the name to form a globally-unique sourceId.
// Also flattens the nested config object (dimensions/metric).
const accountId =
    (context.objects && context.objects[0] && context.objects[0].rawId) || "";

result = ((data && data.result) || []).map((idx) => {
    const cfg = idx.config || {};
    return {
        sourceId: `${accountId}:${idx.name}`,
        indexName: idx.name,
        accountId: accountId,
        dimensions:
            typeof cfg.dimensions === "number" ? cfg.dimensions : null,
        metric: cfg.metric || "",
        createdOn: idx.created_on,
        modifiedOn: idx.modified_on,
    };
});
