// Environment keys repeat across projects, so the object id combines both keys.
// SDK and mobile keys in the response are deliberately not copied into the rows.
const projectKey = context.objects[0].rawId;

result = (data?.items || []).map((env) => ({
    environmentId: `${projectKey}/${env.key}`,
    name: env.name,
    environmentKey: env.key,
    projectKey,
    critical: env.critical === true,
    tagList: (env.tags || []).join(", "),
}));
