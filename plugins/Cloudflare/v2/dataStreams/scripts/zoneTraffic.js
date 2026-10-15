// Cloudflare answers HTTP 200 even when the GraphQL query failed, and a
// postRequestScript bypasses the stream's declarative errorHandling entirely,
// so the error is raised here or it would be swallowed into an empty result.
if (data && data.errors && data.errors.length) {
    throw new Error("Cloudflare GraphQL error: " + data.errors[0].message);
}

// dataStreams/scripts/zoneTraffic.js
// SquaredUp runs this stream once per zone in scope and joins the rows, so a tile
// scoped to several zones cannot tell which rows belong to which zone. Stamp the
// scoped zone's tag and name onto every row so tiles and SQL can group by zone.
// Column names keep the dotted form the previous expandInnerObjects config produced.

const zone = (context.objects && context.objects[0]) || {};
const zoneTag = zone.rawId || "";
const zoneName = zone.name || zoneTag;

const groups =
    (data &&
        data.data &&
        data.data.viewer &&
        data.data.viewer.zones &&
        data.data.viewer.zones[0] &&
        data.data.viewer.zones[0].httpRequests1hGroups) ||
    [];

result = groups.map((row) => {
    const sum = row.sum || {};
    const uniq = row.uniq || {};

    return {
        zoneTag: zoneTag,
        zoneName: zoneName,
        "dimensions.datetime": row.dimensions && row.dimensions.datetime,
        "sum.requests": Number(sum.requests || 0) || 0,
        "sum.cachedRequests": Number(sum.cachedRequests || 0) || 0,
        "sum.bytes": Number(sum.bytes || 0) || 0,
        "sum.cachedBytes": Number(sum.cachedBytes || 0) || 0,
        "sum.threats": Number(sum.threats || 0) || 0,
        "sum.pageViews": Number(sum.pageViews || 0) || 0,
        "sum.encryptedRequests": Number(sum.encryptedRequests || 0) || 0,
        "uniq.uniques": Number(uniq.uniques || 0) || 0
    };
});
