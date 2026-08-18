// Written defensively: no Realtime application exists in the test account, so
// the response shape follows Cloudflare's docs and falls back across likely keys.
const accountId =
    (context.objects && context.objects[0] && context.objects[0].rawId) || "";

result = ((data && data.result) || []).map((a) => ({
    sourceId: a.uid || a.id,
    appName: a.name || a.uid || a.id || "",
    accountId: accountId,
    createdOn: a.created,
    modifiedOn: a.modified,
}));
