// dataStreams/scripts/imagesRequests.js
// Cloudflare answers a failed GraphQL query with HTTP 200 and a populated `errors` array,
// so the request never looks like a failure and the stream's `errorHandling` does not
// reliably fire on it (confirmed against this endpoint's imagesTransformationsAdaptiveGroups
// node, which returns exactly this shape). Check for it explicitly so a broken/over-wide
// query surfaces as a real error instead of silently shaping to a degenerate row.
const graphqlErrors = (data && data.errors) || [];
if (graphqlErrors.length) {
    throw new Error(
        "Cloudflare GraphQL error: " +
            graphqlErrors.map((e) => (e && e.message) || JSON.stringify(e)).join(" | ")
    );
}

const groups =
    (data &&
        data.data &&
        data.data.viewer &&
        data.data.viewer.accounts &&
        data.data.viewer.accounts[0] &&
        data.data.viewer.accounts[0].imagesRequestsAdaptiveGroups) ||
    [];

result = groups.map((row) => ({
    date: row.dimensions && row.dimensions.date,
    requests: Number((row.sum && row.sum.requests) || 0) || 0
}));
