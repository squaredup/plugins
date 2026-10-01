// dataStreams/scripts/teams.js
// The v3/teams response nests a `members` array per team. A metadata
// valueExpression cannot compute a length from a sibling array/object
// column (cross-column references receive an already-shaped placeholder,
// not the real array), so the member count is derived here instead,
// against the untouched raw response.
result = (data.teams || []).map((team) => ({
    ...team,
    memberCount: (team.members || []).length,
}));
