// Response body: { data: [{ parent, child, callCount }] } from the Jaeger-compatible API.
// Returns nothing when "Services and dependencies" is unticked in the data source.
const dataSource = (Array.isArray(context.dataSources) && context.dataSources[0]) || {};
const links = dataSource.indexServices === false || !Array.isArray(data?.data) ? [] : data.data;
result = links
    .filter((l) => l.parent && l.child)
    .map((l) => ({
        id: `${l.parent}|${l.child}`,
        name: `${l.parent} → ${l.child}`,
        parent: l.parent,
        child: l.child,
        callCount: Number(l.callCount) || 0
    }));
