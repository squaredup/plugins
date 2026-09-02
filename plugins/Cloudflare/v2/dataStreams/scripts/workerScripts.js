// Build a globally-unique sourceId for each Worker script.
// Script names are only unique within an account, so the account id from the
// scoped object is prefixed onto the name.
const accountId =
    (context.objects && context.objects[0] && context.objects[0].rawId) || "";

result = ((data && data.result) || []).map((script) => ({
    sourceId: `${accountId}:${script.id}`,
    scriptName: script.id,
    accountId: accountId,
    usageModel: script.usage_model || "",
    handlers: (script.handlers || []).join(", "),
    placementMode: (script.placement && script.placement.mode) || "",
    logpush: Boolean(script.logpush),
    createdOn: script.created_on,
    modifiedOn: script.modified_on,
}));
