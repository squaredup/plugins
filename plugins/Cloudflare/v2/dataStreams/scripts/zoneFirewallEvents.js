// Cloudflare answers HTTP 200 even when the GraphQL query failed, and a
// postRequestScript bypasses the stream's declarative errorHandling entirely,
// so the error is raised here or it would be swallowed into an empty result.
if (data && data.errors && data.errors.length) {
    const message = data.errors[0].message || "";
    // The range and history Cloudflare allows for firewall events depend on the zone's
    // plan, so the stream offers timeframes only higher plans can serve. When a plan's
    // limit rejects one, say so rather than surfacing the raw quota error alone.
    // String methods rather than a regex: backslash escapes do not survive into the
    // deployed script.
    const limitText = (marker, lead) => {
        const at = message.indexOf(marker);
        if (at < 0) return null;
        const rest = message.slice(at + marker.length).trim();
        return lead + rest.split(" ")[0].split(",")[0];
    };
    const limit =
        limitText("cannot request a time range wider than", "a range of ") ||
        limitText("cannot request data older than", "the last ");
    if (limit) {
        throw new Error(
            "Cloudflare's plan for this zone limits firewall events to " +
                limit +
                ". Choose a shorter timeframe - longer ranges need a higher Cloudflare plan. (" +
                message +
                ")"
        );
    }
    throw new Error("Cloudflare GraphQL error: " + message);
}

// dataStreams/scripts/zoneFirewallEvents.js
// The GraphQL query interpolates {{breakdown}} into the dimensions selection, so the
// key holding the selected dimension's value inside each row's `dimensions` object varies
// with the user-selected breakdown (dimensions.ruleId vs dimensions.source vs ...). The
// `action` dimension is always present under a fixed key. Normalise both to stable
// columns regardless of which breakdown dimension was chosen.

const dimensionKey = context.config && context.config.breakdown;

const groups =
    (data &&
        data.data &&
        data.data.viewer &&
        data.data.viewer.zones &&
        data.data.viewer.zones[0] &&
        data.data.viewer.zones[0].firewallEventsAdaptiveGroups) ||
    [];

result = groups.map((row) => {
    const rawValue = dimensionKey ? row.dimensions && row.dimensions[dimensionKey] : undefined;
    const breakdown = rawValue === undefined || rawValue === null || rawValue === "" ? "Unknown" : String(rawValue);

    const rawAction = row.dimensions && row.dimensions.action;
    const action = rawAction === undefined || rawAction === null || rawAction === "" ? "Unknown" : String(rawAction);

    return {
        breakdown: breakdown,
        action: action,
        events: Number(row.count !== undefined && row.count !== null ? row.count : 0) || 0
    };
});
