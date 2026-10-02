// One row per task classification, with its macro-category label and the
// task's most used model, plus the as-of date and citation OpenRouter requires.
// Shares are fractions (0-1) of sampled traffic.
const body = data?.data ?? {};
const categoryLabels = Object.fromEntries((body.macro_categories ?? []).map((c) => [c.key, c.label]));

result = (body.classifications ?? []).map((c) => {
    // models isn't ordered by request share, so pick the largest explicitly
    const topModel = (c.models ?? []).reduce((top, m) => (!top || m.tag_usage_share > top.tag_usage_share ? m : top), null);

    return {
        tag: c.tag,
        task: c.display_name,
        category: categoryLabels[c.macro_category] ?? c.macro_category,
        usageShare: c.usage_share,
        tokenShare: c.token_share,
        topModel: topModel?.id ?? null,
        topModelUsageShare: topModel?.tag_usage_share ?? null,
        asOf: body.as_of,
        citation: `Source: OpenRouter (openrouter.ai/rankings), as of ${body.as_of}. Licensed under CC BY 4.0.`,
    };
});
