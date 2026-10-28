// Flag keys are only unique within a project, so the flag id combines both keys.
// With the env query arg, per-environment state sits under flag.environments.<envKey>.
const { projectKey, environmentKey, environmentName: environmentNameProperty } = context.objects[0];
const scalar = (v) => (Array.isArray(v) ? v[0] : v);
const project = scalar(projectKey);
const envKey = scalar(environmentKey);
const environmentName = scalar(environmentNameProperty);

const maintainerName = (flag) => {
    const member = flag._maintainer;
    if (member) {
        return [member.firstName, member.lastName].filter(Boolean).join(" ") || member.email;
    }
    return flag._maintainerTeam?.name;
};

const variationLabel = (flag, index) => {
    const variation = flag.variations?.[index];
    if (!variation) {
        return null;
    }
    return variation.name || JSON.stringify(variation.value);
};

const sumVariations = (summary, ...keys) =>
    Object.values(summary?.variations || {}).reduce(
        (total, v) => total + keys.reduce((n, k) => n + (v?.[k] || 0), 0),
        0
    );

const servingVariation = (flag, env) => {
    const entries = Object.entries(env._summary?.variations || {});
    if (entries.some(([, v]) => v?.rollout)) {
        return "Percentage rollout";
    }
    const fallthrough = entries.find(([, v]) => v?.isFallthrough);
    return fallthrough ? variationLabel(flag, fallthrough[0]) : null;
};

const offVariation = (flag, env) => {
    const entry = Object.entries(env._summary?.variations || {}).find(([, v]) => v?.isOff);
    return entry ? variationLabel(flag, entry[0]) : null;
};

const iso = (ms) => (ms ? new Date(ms).toISOString() : null);

result = (data?.items || []).map((flag) => {
    const env = flag.environments?.[envKey] || {};
    const environment = env._environmentName || environmentName || envKey;
    return {
        flagId: `${project}/${flag.key}`,
        name: flag.name,
        flagKey: flag.key,
        environmentId: `${project}/${envKey}`,
        environment,
        // Environment names such as "Production" repeat across projects, so cross-project views use this label.
        environmentLabel: `${project} / ${environment}`,
        project,
        on: env.on === true,
        status: env.on === true ? "On" : "Off",
        servingVariation: servingVariation(flag, env),
        offVariation: offVariation(flag, env),
        rules: sumVariations(env._summary, "rules"),
        targets: sumVariations(env._summary, "targets", "contextTargets"),
        prerequisites: env._summary?.prerequisites || 0,
        lastModified: iso(env.lastModified),
        createdAt: iso(flag.creationDate),
        kind: flag.kind,
        temporary: flag.temporary === true,
        tagList: (flag.tags || []).join(", "),
        maintainer: maintainerName(flag),
        version: env.version,
    };
});
