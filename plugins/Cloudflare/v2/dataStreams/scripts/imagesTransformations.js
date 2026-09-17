// Cloudflare's GraphQL API answers HTTP 200 even when the query failed, and the
// stream-level errorHandling does not reliably fire for that case, so the error
// is raised here explicitly rather than shaping to a misleading empty result.
//
// Note this uses imagesUniqueTransformations, not imagesTransformationsAdaptiveGroups:
// the latter returns INTERNAL_SERVER_ERROR from Cloudflare for every query shape
// and timeframe tested, on every account tested.
if (data && data.errors && data.errors.length) {
    throw new Error("Cloudflare GraphQL error: " + data.errors[0].message);
}

const accounts =
    (data && data.data && data.data.viewer && data.data.viewer.accounts) || [];
const rows = (accounts[0] || {}).imagesUniqueTransformations || [];

result = rows.map((r) => ({
    date: r.date,
    transformations:
        typeof r.transformations === "number" ? r.transformations : null,
}));
