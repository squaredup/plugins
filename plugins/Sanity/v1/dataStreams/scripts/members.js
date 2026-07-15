// dataStreams/scripts/members.js
// Flatten each member into name, email, roles columns.
// `data` is the parsed response body: { data: [...], nextCursor, totalCount }
// pathToData is ignored when postRequestScript is set, so navigate manually.
const object = context.objects[0];
const members = (data && data.data) || [];

// sanityUserId alone is not unique across projects: the same user imported from two
// projects would merge into one object, keeping only one project's membership data.
result = members.map((user) => ({
    ...user,
    membershipId: `${user.sanityUserId}:${object?.rawId}`,
    name: user.profile && user.profile.displayName,
    email: user.profile && user.profile.email,
    roles: (user.memberships || [])
        .flatMap((m) => m.roleNames || [])
        .join(", "),
    sanityUserId: user.sanityUserId,
    imageUrl: user.profile && user.profile.imageUrl,
}));

