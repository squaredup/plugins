// Only return projects the user has configured a content API token for.
// Projects without a token can't serve any data streams, so indexing them
// would let users scope dashboards to objects that only show project details, no dataset/member data.
// Token values arrive encrypted here, but the keys (project IDs) are usable.
const configured = ((context.dataSources[0] || {}).projects || []).map(
    (p) => p.key,
);
result = (data || []).filter((project) => configured.includes(project.id));

