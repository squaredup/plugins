const project = context.objects[0];
const toIso = (ms) => (typeof ms === 'number' ? new Date(ms).toISOString() : null);

result = (Array.isArray(data) ? data : []).map((fn) => ({
    id: fn.id,
    name: fn.name,
    objectName: `${project.name} / ${fn.name}`,
    slug: fn.slug,
    status: fn.status,
    version: fn.version,
    verifyJwt: fn.verify_jwt,
    createdAt: toIso(fn.created_at),
    updatedAt: toIso(fn.updated_at),
    projectRef: project.rawId,
    projectName: project.name,
    dashboardUrl: `https://supabase.com/dashboard/project/${project.rawId}/functions/${fn.slug}`
}));
