// Optional `top`: for each date (day, week, or month), keep that period's N
// biggest models and merge the rest (including OpenRouter's own `other` row)
// into one "Other" row, matching how openrouter.ai/rankings charts its top
// models. Without it, rows pass through. Every row then gets the as-of date
// and citation OpenRouter requires.
const rows = data?.data ?? [];
const top = Number(context.config.top);

if (!(top > 0)) {
    result = rows;
} else {
    const byDate = {};

    for (const r of rows) {
        const period = byDate[r.date] ?? (byDate[r.date] = []);
        period.push({ ...r, total_tokens: Number(r.total_tokens) });
    }

    result = [];

    for (const [date, periodRows] of Object.entries(byDate).sort(([a], [b]) => a.localeCompare(b))) {
        const ranked = periodRows
            .filter((r) => r.model_permaslug !== 'other')
            .sort((a, b) => b.total_tokens - a.total_tokens);

        const kept = ranked.slice(0, top);
        const keptModels = new Set(kept.map((r) => r.model_permaslug));
        const other = periodRows
            .filter((r) => !keptModels.has(r.model_permaslug))
            .reduce((sum, r) => sum + r.total_tokens, 0);

        result.push(...kept);

        if (other > 0) result.push({ date, model_permaslug: 'Other', total_tokens: other });
    }
}

// Attribution OpenRouter requires when republishing this dataset
const asOf = data?.meta?.as_of;
const citation = `Source: OpenRouter (openrouter.ai/rankings), as of ${asOf}. Licensed under CC BY 4.0.`;
result = result.map((r) => ({ ...r, asOf, citation }));
