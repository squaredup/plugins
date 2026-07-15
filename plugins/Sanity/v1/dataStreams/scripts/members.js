// dataStreams/scripts/members.js
// Flatten each member into name, email, roles columns.
// `data` is the parsed response body: { data: [...], nextCursor, totalCount }
// pathToData is ignored when postRequestScript is set, so navigate manually.
const object = context.objects[0];
const members = (data && data.data) || [];

// sanityUserId alone is not unique across projects: the same user imported from two
// projects would merge into one object, keeping only one project's membership data.
// A user's memberships array can span resources, so keep only the membership for
// the project being imported — otherwise projectId and roles can come from another
// project the user belongs to.
result = members.map((user) => {
    const membership = (user.memberships || []).find((m) => m.resourceId === object?.rawId);

    return {
        ...user,
        memberships: membership ? [membership] : [],
        membershipId: `${user.sanityUserId}:${object?.rawId}`,
        name: user.profile && user.profile.displayName,
        email: user.profile && user.profile.email,
        roles: ((membership && membership.roleNames) || []).join(", "),
        sanityUserId: user.sanityUserId,
        imageUrl: user.profile && user.profile.imageUrl,
    };
});

