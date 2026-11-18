// Every interesting TeamDynamix endpoint is application-scoped — /api/{appId}/tickets/search,
// /api/{appId}/assets/search and so on — so applications are imported as objects and every
// other stream hangs off them. That way a user picks "Service Desk" by name and never has to
// know an app ID.
//
// Splitting the single /api/applications response into three object types is what makes the
// object pickers useful: a ticket stream should only offer Ticketing apps, not the Client
// Portal.
//
// AppClass decides first. The API documents it as the application's system name (TDTickets,
// TDAssets), a fixed identifier. Type is a display label the API only describes in prose: it
// says "Assets/CI" there but "Assets/CIs" everywhere else, and an exact match on "Assets/CI"
// left a real tenant with no Asset App objects, so the asset and configuration item imports
// had nothing to run against. Type is still a fallback, matched loosely.
const ofKind = (app) => {
    const appClass = String(app.AppClass || "").toLowerCase();
    const type = String(app.Type || "").toLowerCase();
    if (appClass === "tdtickets") return "ticketing";
    if (appClass === "tdassets") return "asset";
    if (type.startsWith("ticket")) return "ticketing";
    if (type.startsWith("asset")) return "asset";
    return "other";
};

const SOURCE_TYPE_BY_KIND = {
    ticketing: "TeamDynamix Ticketing App",
    asset: "TeamDynamix Asset App",
    other: "TeamDynamix Application"
};

// The setup checks pass `kind` to ask "was a ticketing (or asset) app recognised?", so a
// tenant whose applications don't classify is told when the data source is saved rather than
// after an import quietly finds nothing. The import passes no kind and gets every app.
const wantedKind = context?.config?.kind;

// Inactive applications are filtered out rather than imported and ignored: the asset and
// configuration item import steps are scoped to Asset App objects, so a retired app left in
// the graph would have requests fired at it on every import.
result = (Array.isArray(data) ? data : [])
    .filter((app) => app.Active !== false)
    .filter((app) => !wantedKind || wantedKind === "all" || ofKind(app) === wantedKind)
    .map((app) => ({
        appId: String(app.AppID),
        name: app.Name,
        appType: app.Type || "",
        appClass: app.AppClass || "",
        description: app.Description || "",
        sourceType: SOURCE_TYPE_BY_KIND[ofKind(app)]
    }));
