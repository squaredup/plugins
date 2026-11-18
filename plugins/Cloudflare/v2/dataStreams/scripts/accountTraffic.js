// Cloudflare answers HTTP 200 even when the GraphQL query failed, so raise the
// errors array here or the tile would show no data instead of the reason.
if (data && data.errors && data.errors.length) {
    api.report.error("Cloudflare GraphQL error: " + data.errors.map((e) => e && e.message).join(" | "));
}

// dataStreams/scripts/accountTraffic.js
// httpRequestsAdaptiveGroups at account level covers every zone in the account in one
// query. The selected breakdown dimension is interpolated into the query, so its value
// sits under a different key per breakdown; normalise it to a stable `breakdown` column.
// When the breakdown is the zone, the zone tag is also emitted as `zoneTag`, which the
// stream's metadata resolves to the imported zone's name.

const account = (context.objects && context.objects[0]) || {};
const dimensionKey = (context.config && context.config.breakdown) || "zoneTag";

const accounts = (data && data.data && data.data.viewer && data.data.viewer.accounts) || [];
const groups = (accounts[0] || {}).httpRequestsAdaptiveGroups || [];

result = groups.map((row) => {
    const dims = row.dimensions || {};
    const sum = row.sum || {};
    const raw = dims[dimensionKey];
    const value = raw === undefined || raw === null || raw === "" ? "Unknown" : String(raw);
    return {
        datetime: dims.datetime,
        breakdown: value,
        zoneTag: dimensionKey === "zoneTag" ? value : null,
        requests: Number(row.count || 0) || 0,
        bytes: Number(sum.edgeResponseBytes || 0) || 0,
        visits: Number(sum.visits || 0) || 0,
        accountName: account.name || account.rawId || "",
        accountId: account.rawId || "",
    };
});
