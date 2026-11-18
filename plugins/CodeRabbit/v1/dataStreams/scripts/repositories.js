// Tag each repository with its parent organization, which the API response omits.
const org = context.objects[0] || {};
result = (data.repositories || []).map((repo) => ({
    ...repo,
    organizationId: org.rawId,
    organizationName: org.name,
}));
