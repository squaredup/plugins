// The response has no flag key field; the parent link is "/api/v2/flags/<projectKey>/<flagKey>".
// Flag keys are only unique within a project, so flagId combines both, matching the Flag objects.
const flagIdFromLink = (flag) => {
    const href = flag?._links?.parent?.href;
    return typeof href === "string" ? href.split("/").slice(-2).join("/") : null;
};

const scalar = (v) => (Array.isArray(v) ? v[0] : v);
const { projectKey, environmentKey, environmentName: environmentNameProperty } = context.objects[0];
const project = scalar(projectKey);
const envKey = scalar(environmentKey);
const environmentName = scalar(environmentNameProperty) || envKey;

result = (data?.items || []).map((flag) => {
    const flagId = flagIdFromLink(flag);
    const defaultValue = flag.default;
    return {
        flagId,
        flagKey: flagId ? flagId.split("/").pop() : null,
        environmentId: `${project}/${envKey}`,
        environment: environmentName,
        // Environment names such as "Production" repeat across projects, so cross-project views use this label.
        environmentLabel: `${project} / ${environmentName}`,
        project,
        status: flag.name ? flag.name.charAt(0).toUpperCase() + flag.name.slice(1) : null,
        health: flag.name || null,
        lastRequested: flag.lastRequested || null,
        default: defaultValue === undefined || defaultValue === null || typeof defaultValue === "string"
            ? defaultValue ?? null
            : JSON.stringify(defaultValue),
    };
});
