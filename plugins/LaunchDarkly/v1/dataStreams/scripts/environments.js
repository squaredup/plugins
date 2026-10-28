// Environment keys repeat across projects, so the object id combines both keys.
// Names such as "Production" repeat too, so the object name is prefixed with the project's name.
// SDK and mobile keys in the response are deliberately not copied into the rows.
const projectKey = context.objects[0].rawId;
const projectName = context.objects[0].name;

result = (data?.items || []).map((env) => ({
    environmentId: `${projectKey}/${env.key}`,
    name: `${projectName} / ${env.name}`,
    environmentName: env.name,
    environmentKey: env.key,
    projectKey,
    critical: env.critical === true,
    tagList: (env.tags || []).join(", "),
}));
