// Response body: { data: [{ parent, child, callCount }] } from the Jaeger-compatible API,
// for the tile's timeframe. When objects are selected, only calls to or from the selected
// services are kept. Both ends link to their Service objects.
const unwrap = (v) => (Array.isArray(v) ? v[0] : v);
const scope = Array.isArray(context.config?.scope) ? context.config.scope : [];
const scoped = new Set(scope.map((o) => unwrap(o?.serviceName) || unwrap(o?.rawId) || o?.name).filter((v) => v));
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
