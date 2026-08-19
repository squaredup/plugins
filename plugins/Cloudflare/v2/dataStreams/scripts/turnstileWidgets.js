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
    // Kept as an array, not a joined string: it is the join key for the
    // Turnstile Widget -> Zone correlation rule, and correlation matches an
    // array property if any element matches.
    domains: w.domains || [],
    botFightMode: Boolean(w.bot_fight_mode),
    createdOn: w.created_on,
    modifiedOn: w.modified_on,
}));
