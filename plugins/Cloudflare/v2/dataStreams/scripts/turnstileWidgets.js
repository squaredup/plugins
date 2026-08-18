// The Turnstile sitekey is the widget's stable identifier and is globally
// unique, so it doubles as the sourceId.
const accountId =
    (context.objects && context.objects[0] && context.objects[0].rawId) || "";

result = ((data && data.result) || []).map((w) => ({
    sourceId: w.sitekey,
    widgetName: w.name || w.sitekey,
    accountId: accountId,
    mode: w.mode || "",
    region: w.region || "",
    domains: (w.domains || []).join(", "),
    botFightMode: Boolean(w.bot_fight_mode),
    createdOn: w.created_on,
    modifiedOn: w.modified_on,
}));
