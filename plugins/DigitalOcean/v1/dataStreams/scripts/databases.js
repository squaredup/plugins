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
    vpcUuid: d.private_network_uuid || null,
    tagList: (d.tags || []).join(", "),
    createdAt: d.created_at
}));

// Optional Project/VPC object pickers arrive at context.config.<name> as arrays whose rawId is a single-element array; empty means no filter
const unwrap = (v) => (Array.isArray(v) ? v[0] : v);
for (const [param, column] of Object.entries({ project: "projectId", vpc: "vpcUuid" })) {
    const ids = new Set((context.config?.[param] || []).map((o) => unwrap(o.rawId)).filter(Boolean));
    if (ids.size) result = result.filter((row) => ids.has(row[column]));
}
