result = (data.environments ?? []).map((env) => ({
    label: env.name,
    value: env.name,
}));
