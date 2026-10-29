// Stamp each key with its project and flatten the owner, which is either a user or a service account
const project = context.objects[0];
// The API returns Unix seconds; SquaredUp expects ISO 8601
const toIso = (v) => (v ? new Date(v * 1000).toISOString() : null);
const unwrap = (v) => (Array.isArray(v) ? v[0] : v);
const keys = Array.isArray(data) ? data : (data?.data ?? []);

result = keys.map((k) => {
    const owner = k.owner?.user ?? k.owner?.service_account ?? {};
    return {
        id: k.id,
        name: k.name,
        redacted_value: k.redacted_value,
        projectId: unwrap(project.rawId),
        projectName: unwrap(project.name),
        created_at: toIso(k.created_at),
        last_used_at: toIso(k.last_used_at),
        ownerType: k.owner?.type,
        ownerName: owner.name,
        ownerEmail: owner.email,
    };
});
