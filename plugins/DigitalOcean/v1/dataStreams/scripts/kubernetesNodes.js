// Flattens node pools into one row per worker node, carrying the pool settings
result = (data.node_pools || []).flatMap((p) =>
    (p.nodes || []).map((n) => ({
        id: n.id,
        name: n.name,
        poolName: p.name,
        poolSize: p.size,
        status: n.status?.state || null,
        dropletId: n.droplet_id != null ? String(n.droplet_id) : null,
        autoScale: p.auto_scale,
        poolCount: p.count,
        minNodes: p.min_nodes,
        maxNodes: p.max_nodes,
        createdAt: n.created_at,
        updatedAt: n.updated_at
    }))
);
