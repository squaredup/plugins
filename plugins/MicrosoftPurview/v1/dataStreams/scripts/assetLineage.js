const baseGuid = data?.baseEntityGuid;
const map = data?.guidEntityMap || {};
const relations = data?.relations || [];

// Build directed adjacency: inEdges[node] = sources feeding into node (upstream)
// outEdges[node] = destinations fed from node (downstream)
const inEdges = {};
const outEdges = {};
for (const r of relations) {
    if (!inEdges[r.toEntityId]) inEdges[r.toEntityId] = [];
    inEdges[r.toEntityId].push(r.fromEntityId);
    if (!outEdges[r.fromEntityId]) outEdges[r.fromEntityId] = [];
    outEdges[r.fromEntityId].push(r.toEntityId);
}

// BFS to collect all reachable upstream nodes across multiple hops
const upstream = new Set();
let frontier = [baseGuid];
while (frontier.length > 0) {
    const next = [];
    for (const node of frontier) {
        for (const src of (inEdges[node] || [])) {
            if (src !== baseGuid && !upstream.has(src)) {
                upstream.add(src);
                next.push(src);
            }
        }
    }
    frontier = next;
}

// BFS to collect all reachable downstream nodes across multiple hops
const downstream = new Set();
frontier = [baseGuid];
while (frontier.length > 0) {
    const next = [];
    for (const node of frontier) {
        for (const dst of (outEdges[node] || [])) {
            if (dst !== baseGuid && !downstream.has(dst)) {
                downstream.add(dst);
                next.push(dst);
            }
        }
    }
    frontier = next;
}

result = Object.entries(map).map(([guid, e]) => {
    let role = 'Downstream';
    if (guid === baseGuid) role = 'Base';
    else if (upstream.has(guid)) role = 'Upstream';

    const attrs = e.attributes || {};
    return {
        guid,
        name: attrs.name || e.displayText || guid,
        typeName: e.typeName || '',
        qualifiedName: attrs.qualifiedName || '',
        role,
        status: e.status || '',
        classifications: (e.classificationNames || []).join(', '),
    };
});
