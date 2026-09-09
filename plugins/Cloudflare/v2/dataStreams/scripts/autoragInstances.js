// Written defensively: no AutoRAG instance exists in the test account, so the
// response shape follows Cloudflare's docs and falls back across likely keys.
const accountId =
    (context.objects && context.objects[0] && context.objects[0].rawId) || "";

result = ((data && data.result) || []).map((r) => ({
    sourceId: r.id || `${accountId}:${r.name}`,
    ragName: r.name || r.id || "",
    accountId: accountId,
    status: r.status || "",
    source: r.source || (r.data_source && r.data_source.type) || "",
    createdOn: r.created_at || r.created_on,
}));
