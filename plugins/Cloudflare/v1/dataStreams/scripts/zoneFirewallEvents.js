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
