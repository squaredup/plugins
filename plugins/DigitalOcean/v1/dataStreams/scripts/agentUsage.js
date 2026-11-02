// Flattens agent and log insights usage measurements into one row per usage type
const sources = [
    ["Agent", data.usage],
    ["Log insights", data.log_insights_usage]
];
result = sources.flatMap(([source, u]) =>
    (u?.measurements || []).map((m) => ({
        start: u.start,
        stop: u.stop,
        source,
        usageType: m.usage_type,
        tokens: Number(m.tokens || 0)
    }))
);
