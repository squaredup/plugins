// Cloudflare answers HTTP 200 even when the GraphQL query failed, and a
// postRequestScript bypasses the stream's declarative errorHandling entirely,
// so the error is raised here or it would be swallowed into an empty result.
if (data && data.errors && data.errors.length) {
    throw new Error("Cloudflare GraphQL error: " + data.errors[0].message);
}

// dataStreams/scripts/zoneFirewallEventVolume.js
// firewallEventsAdaptiveByTimeGroups counts every firewall event and allows 30 days on
// every plan, unlike firewallEventsAdaptiveGroups behind Zone Firewall Events (1 day on
// Pro, unavailable on Free). It cannot group by action or service, only filter by them,
// so this stream is a single series over time. The query aliases the time bucket it
// chose for the timeframe to `datetime`.
//
// SquaredUp runs this stream once per zone in scope and joins the rows, so stamp the
// zone onto every row to let multi-zone tiles tell them apart.

const zone = (context.objects && context.objects[0]) || {};
const zoneTag = zone.rawId || "";
const zoneName = zone.name || zoneTag;

const groups =
    (data &&
        data.data &&
        data.data.viewer &&
        data.data.viewer.zones &&
        data.data.viewer.zones[0] &&
        data.data.viewer.zones[0].firewallEventsAdaptiveByTimeGroups) ||
    [];

result = groups.map((row) => ({
    datetime: row.dimensions && row.dimensions.datetime,
    events: Number(row.count || 0) || 0,
    zoneName: zoneName,
    zoneTag: zoneTag,
}));
