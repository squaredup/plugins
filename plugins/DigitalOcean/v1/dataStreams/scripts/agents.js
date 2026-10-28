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

// Optional Project/VPC object pickers arrive at context.config.<name> as arrays whose rawId is a single-element array; empty means no filter
const unwrap = (v) => (Array.isArray(v) ? v[0] : v);
for (const [param, column] of Object.entries({ project: "projectId" })) {
    const ids = new Set((context.config?.[param] || []).map((o) => unwrap(o.rawId)).filter(Boolean));
    if (ids.size) result = result.filter((row) => ids.has(row[column]));
}
