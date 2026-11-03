// Stamp each key with its project and flatten the owner, which is either a user or a service account
const project = context.objects[0];
const unwrap = (v) => (Array.isArray(v) ? v[0] : v);
const keys = Array.isArray(data) ? data : (data?.data ?? []);

result = keys.map((k) => {
    const owner = k.owner?.user ?? k.owner?.service_account ?? {};
    return {
        id: k.id,
        name: k.name,
        redacted_value: k.redacted_value,
        projectId: unwrap(project.rawId),
        created_at: k.created_at,
        last_used_at: k.last_used_at,
        ownerType: k.owner?.type,
        ownerName: owner.name,
        ownerEmail: owner.email,
    };
});
