// _cat/nodes has no node filter, so the optional Node picker is applied here.
// Selected objects arrive as an array, each rawId a single-element array.
const unwrap = (v) => (Array.isArray(v) ? v[0] : v);
const selected = (context.config && context.config.node) || [];
const nodeIds = new Set(selected.map((o) => unwrap(o.rawId)).filter(Boolean));

result = (data || [])
    .filter((n) => nodeIds.size === 0 || nodeIds.has(n.id))
    .map(({ 'node.roles': roles, cluster_manager: clusterManager, ...n }) => ({
        ...n,
        roles: roles ? roles.split(',') : [],
        // The elected cluster manager is marked "*", other nodes "-"
        isClusterManager: clusterManager === '*'
    }));
