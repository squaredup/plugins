// Optional `top`: keep the N models with the most tokens across the window and
// merge the rest (including OpenRouter's own `other` row) into one "Other" row
// per date, so stacked charts stay readable. Without it, rows pass through.
const rows = data?.data ?? [];
const top = Number(context.config.top);

if (!(top > 0)) {
    result = rows;
} else {
    const totals = {};

    for (const r of rows) {
        if (r.model_permaslug === 'other') continue;
        totals[r.model_permaslug] = (totals[r.model_permaslug] ?? 0) + Number(r.total_tokens);
    }

    const kept = new Set(
        Object.entries(totals)
            .sort(([, a], [, b]) => b - a)
            .slice(0, top)
            .map(([model]) => model),
    );

    const otherByDate = {};

    result = [];

    for (const r of rows) {
        if (kept.has(r.model_permaslug)) {
            result.push({ ...r, total_tokens: Number(r.total_tokens) });
        } else {
            otherByDate[r.date] = (otherByDate[r.date] ?? 0) + Number(r.total_tokens);
        }
    }

    for (const [date, total_tokens] of Object.entries(otherByDate)) {
        result.push({ date, model_permaslug: 'Other', total_tokens });
    }

    result.sort((a, b) => a.date.localeCompare(b.date));
}
