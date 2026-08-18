// data is Sanity's raw project list. Flag whether each project has a
// matching entry in the configured Project API tokens, so the dashboard
// can show which projects still need a token added.
const configured = new Set(
    ((context.dataSources[0] || {}).projects || []).map((p) => p.key),
);
result = (data || []).map((project) => ({
    ...project,
    tokenStatus: configured.has(project.id) ? "configured" : "missing",
}));
