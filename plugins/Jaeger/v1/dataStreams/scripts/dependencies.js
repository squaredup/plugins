// dataStreams/scripts/dependencies.js
//
// Jaeger's dependency reader concatenates every stored batch falling inside the
// query window without merging them, so the same parent -> child pair can come
// back more than once. Pre-aggregated storage hits this constantly: the
// spark-dependencies job appends a document per run, and the plugin widens the
// window to whole UTC days (see the lookback expression in dependencies.json),
// so an hourly job yields up to 24 rows for one pair. Sum the call counts so a
// pair is always a single row.
//
// Storage that derives dependencies from spans on demand already returns one
// row per pair, which makes this a no-op there.

const links = (data && data.data) || [];

result = _.map(
    _.groupBy(links, (link) => JSON.stringify([link.parent, link.child])),
    (pairLinks) => ({
        parent: pairLinks[0].parent,
        child: pairLinks[0].child,
        callCount: _.sumBy(pairLinks, (link) => link.callCount || 0),
        source: pairLinks[0].source,
    }),
);
