// api/projects/{id}/feature_flags/ → { count, next, previous, results: [...] }.
// Keep live flags only (drop deleted and archived), and carry the scoping
// project's id onto each row so flag objects link to their project and
// flag-scoped streams know which project to query.
const unwrap = (v) => (Array.isArray(v) ? v[0] : v);
const projectId = unwrap(
    context.objects && context.objects[0] && context.objects[0].rawId,
);
result = (data.results || [])
    .filter((f) => !f.deleted && !f.archived)
    .map((f) => ({
        id: f.id,
        key: f.key,
        description: f.name || "",
        active: !!f.active,
        created_at: f.created_at,
        last_called_at: f.last_called_at,
        project: projectId,
    }));
