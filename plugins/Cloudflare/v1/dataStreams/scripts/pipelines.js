// Written defensively: no pipeline exists in the test account, so the response
// shape follows Cloudflare's docs and falls back across likely keys.
const accountId =
    (context.objects && context.objects[0] && context.objects[0].rawId) || "";

result = ((data && data.result) || []).map((p) => ({
    sourceId: p.id || `${accountId}:${p.name}`,
    pipelineName: p.name || p.id || "",
    accountId: accountId,
    endpoint: p.endpoint || "",
    createdOn: p.created_at || p.created_on,
}));
