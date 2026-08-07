// Every interesting TeamDynamix endpoint is application-scoped — /api/{appId}/tickets/search,
// /api/{appId}/assets/search and so on — so applications are imported as objects and every
// other stream hangs off them. That way a user picks "Service Desk" by name and never has to
// know an app ID.
//
// Splitting the single /api/applications response into three object types is what makes the
// object pickers useful: a ticket stream should only offer Ticketing apps, not the Client
// Portal. Type is documented as one of Standard, Ticketing, Assets/CI, Client Portal or
// External, so anything that isn't Ticketing or Assets/CI falls through to the generic type.
const SOURCE_TYPE_BY_APP_TYPE = {
    Ticketing: "TeamDynamix Ticketing App",
    "Assets/CI": "TeamDynamix Asset App"
};

// Inactive applications are filtered out rather than imported and ignored: the asset and
// configuration item import steps are scoped to Asset App objects, so a retired app left in
// the graph would have requests fired at it on every import.
result = (data || [])
    .filter((app) => app.Active !== false)
    .map((app) => ({
        appId: String(app.AppID),
        name: app.Name,
        appType: app.Type || "",
        appClass: app.AppClass || "",
        description: app.Description || "",
        sourceType: SOURCE_TYPE_BY_APP_TYPE[app.Type] || "TeamDynamix Application"
    }));
