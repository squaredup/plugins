// The flag response holds an `environments` map keyed by environment key; one row per environment.
// No SDK or mobile keys are read, so none can leak into the rows.
const projectKey = context.objects[0].projectKey;
const variations = data?.variations || [];

const variationLabel = (index) => {
    if (index === undefined || index === null) {
        return null;
    }
    const variation = variations[index];
    if (!variation) {
        return `Variation ${index}`;
    }
    return variation.name || JSON.stringify(variation.value);
};

const sumTargetValues = (targets) =>
    (targets || []).reduce((total, target) => total + (target.values || []).length, 0);

result = Object.entries(data?.environments || {}).map(([envKey, env]) => {
    const fallthrough = env.fallthrough || {};
    return {
        environmentId: `${projectKey}/${envKey}`,
        environment: env._environmentName || envKey,
        environmentKey: envKey,
        on: env.on === true,
        status: env.on === true ? "On" : "Off",
        servingVariation: fallthrough.rollout ? "Percentage rollout" : variationLabel(fallthrough.variation),
        offVariation: variationLabel(env.offVariation),
        rules: (env.rules || []).length,
        targets: sumTargetValues(env.targets) + sumTargetValues(env.contextTargets),
        prerequisites: (env.prerequisites || []).length,
        lastModified: env.lastModified ? new Date(env.lastModified).toISOString() : null,
        version: env.version,
    };
});
