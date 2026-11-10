// GraphQL reports errors with HTTP 200 and an `errors` array, which errorHandling never sees, so raise them here.
const graphqlErrors = ((data && data.errors) || []).map((e) => e && e.message).filter(Boolean);
if (graphqlErrors.length) {
    throw new Error(graphqlErrors.join("; "));
}

const viewer = data && data.data && data.data.viewer;

// No viewer means the token wasn't accepted; configValidation's errorOnEmptyResults reports that.
result = viewer ? [{ userId: viewer.id, name: viewer.name || viewer.id, admin: viewer.admin === true }] : [];
