// Stamps the account id from the scoped object onto every row so the Durable
// Object analytics streams can build their account-scoped GraphQL query, and
// exposes the owning Worker script name as a correlation join key.
const accountId =
    (context.objects && context.objects[0] && context.objects[0].rawId) || "";

result = ((data && data.result) || []).map((ns) => ({
    sourceId: ns.id,
    namespaceName: ns.name || ns.id,
    accountId: accountId,
    scriptName: ns.script || "",
    className: ns.class || "",
    usesSqlite: Boolean(ns.use_sqlite),
}));
