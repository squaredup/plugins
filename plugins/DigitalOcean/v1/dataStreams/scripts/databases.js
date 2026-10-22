// Joins tags, which would otherwise arrive as an array
result = (data.databases || []).map((d) => ({
    id: d.id,
    name: d.name,
    engine: d.engine,
    version: d.version,
    status: d.status,
    region: d.region,
    size: d.size,
    numNodes: d.num_nodes,
    versionEndOfLife: d.version_end_of_life || null,
    projectId: d.project_id || null,
    tagList: (d.tags || []).join(", "),
    createdAt: d.created_at
}));
