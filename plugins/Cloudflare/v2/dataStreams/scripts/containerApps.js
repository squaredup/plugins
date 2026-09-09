// Written defensively: no container application exists in the test account, so
// the response shape follows Cloudflare's docs and falls back across likely keys.
const accountId =
    (context.objects && context.objects[0] && context.objects[0].rawId) || "";

result = ((data && data.result) || []).map((a) => {
    const cfg = a.configuration || {};
    return {
        sourceId: a.id || `${accountId}:${a.name}`,
        appName: a.name || a.id || "",
        accountId: accountId,
        instances: typeof a.instances === "number" ? a.instances : null,
        imageName: cfg.image || a.image || "",
        schedulingPolicy: a.scheduling_policy || "",
        createdOn: a.created_at || a.created_on,
    };
});
