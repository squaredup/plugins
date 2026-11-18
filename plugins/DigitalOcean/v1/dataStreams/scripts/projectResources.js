// Resources are only listed as URNs ("do:<type>:<id>"), so split them into a type and an id that matches the resource's rawId
const projectId = context.objects?.[0]?.rawId;

result = (data.resources || []).map((r) => {
    const [, type, ...rest] = (r.urn || "").split(":");
    const resourceId = rest.join(":");
    return {
        id: r.urn,
        name: `${type} ${resourceId}`,
        projectId,
        resourceType: type,
        resourceId,
        status: r.status || null,
        assignedAt: r.assigned_at || null
    };
});
