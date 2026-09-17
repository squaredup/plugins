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
    // Two columns, because the import serialises an array property to a JSON
    // string and correlation can only compare scalars: `domains` is for display
    // and `primaryDomain` is the join key for the Turnstile Widget -> Zone rule.
    domains: (w.domains || []).join(", "),
    primaryDomain: (w.domains || [])[0] || "",
    botFightMode: Boolean(w.bot_fight_mode),
    createdOn: w.created_on,
    modifiedOn: w.modified_on,
}));
