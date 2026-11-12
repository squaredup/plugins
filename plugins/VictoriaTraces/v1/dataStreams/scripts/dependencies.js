// Response body: { data: [{ parent, child, callCount }] } from the Jaeger-compatible API,
// for the tile's timeframe. When objects are selected, only calls to or from the selected
// services are kept. Both ends link to their Service objects.
// Objects merged across data sources can carry several values per property, so every
// service name and raw id of each selected object counts.
const scope = Array.isArray(context.config?.scope) ? context.config.scope : [];
const values = (v) => (Array.isArray(v) ? v : v === undefined || v === null ? [] : [v]);
const scoped = new Set(
    scope.flatMap((o) => values(o?.serviceName).concat(values(o?.rawId), values(o?.name))).filter((v) => typeof v === 'string' && v)
);
const links = Array.isArray(data?.data) ? data.data : [];
result = links
    .filter((l) => l.parent && l.child)
    .filter((l) => scoped.size === 0 || scoped.has(l.parent) || scoped.has(l.child))
    .map((l) => ({
        CallerLink: l.parent,
        CallerLinkId: l.parent,
        CalleeLink: l.child,
        CalleeLinkId: l.child,
        calls: Number(l.callCount) || 0
    }));
