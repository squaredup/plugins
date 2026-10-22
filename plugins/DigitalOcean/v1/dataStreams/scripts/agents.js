// Flattens model and deployment details and joins tags, which would otherwise arrive as an array
result = (data.agents || []).map((a) => ({
    id: a.uuid,
    name: a.name,
    deploymentStatus: a.deployment?.status || null,
    visibility: a.deployment?.visibility || null,
    model: a.model?.name || null,
    region: a.region || null,
    url: a.deployment?.url || a.url || null,
    projectId: a.project_id || null,
    tagList: (a.tags || []).join(", "),
    createdAt: a.created_at,
    updatedAt: a.updated_at
}));
