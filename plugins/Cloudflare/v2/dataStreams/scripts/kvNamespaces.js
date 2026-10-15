// Stamps the account id from the scoped object onto every row so downstream
// KV analytics streams can build their account-scoped GraphQL query.
const accountId =
    (context.objects && context.objects[0] && context.objects[0].rawId) || "";

result = ((data && data.result) || []).map((ns) => ({
    sourceId: ns.id,
    namespaceTitle: ns.title,
    accountId: accountId,
    supportsUrlEncoding: Boolean(ns.supports_url_encoding),
}));
