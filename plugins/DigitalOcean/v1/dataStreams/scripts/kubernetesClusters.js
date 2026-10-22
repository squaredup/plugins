// Flattens cluster status and summarises the embedded node pools
result = (data.kubernetes_clusters || []).map((c) => {
    const pools = c.node_pools || [];
    return {
        id: c.id,
        name: c.name,
        status: c.status?.state || null,
        statusMessage: c.status?.message || null,
        region: c.region,
        version: c.version,
        nodePools: pools.length,
        nodes: pools.reduce((sum, p) => sum + (p.count || 0), 0),
        ha: c.ha,
        autoUpgrade: c.auto_upgrade,
        endpoint: c.endpoint || null,
        vpcUuid: c.vpc_uuid || null,
        tagList: (c.tags || []).join(", "),
        createdAt: c.created_at,
        updatedAt: c.updated_at
    };
});
