// dataStreams/scripts/members.js
// Flatten each member into name, email, roles columns.
// `data` is the parsed response body: { data: [...], nextCursor, totalCount }
// pathToData is ignored when postRequestScript is set, so navigate manually.
const members = (data && data.data) || [];

result = members.map((user) => ({
    name: user.profile && user.profile.displayName,
    email: user.profile && user.profile.email,
    roles: (user.memberships || [])
        .flatMap((m) => m.roleNames || [])
        .join(", "),
    sanityUserId: user.sanityUserId,
    imageUrl: user.profile && user.profile.imageUrl,
}));
