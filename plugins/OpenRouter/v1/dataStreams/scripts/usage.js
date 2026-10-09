// Normalises analytics rows for the usage and performance streams: one column
// per requested metric, named as OpenRouter names it. The time key is suffixed
// with the granularity (date__day, or created_at__day for raw-view fields like
// latency and provider) and large counts arrive as strings.
// cost_per_million_tokens isn't an OpenRouter metric; it's derived per row when
// total_usage and tokens_total are both requested.
const body = data?.data ?? {};
const groupBy = context.config.groupBy;

if (body.metadata?.truncated) {
    api.report.warning(
        'Results were truncated by OpenRouter; narrow the timeframe or filter to specific objects',
    );
}

const isDateKey = (key) => /__(minute|hour|day|week|month)$/.test(key);

result = (body.data ?? [])
    .map((row) => {
        const out = { date: null, group: groupBy ? row[groupBy] ?? null : null };

        // Numeric strings become numbers; anything else passes through untouched
        for (const [key, value] of Object.entries(row)) {
            if (isDateKey(key)) out.date = value;
            else if (key !== groupBy) out[key] = value != null && Number.isFinite(Number(value)) ? Number(value) : value;
        }

        if ('total_usage' in out && 'tokens_total' in out) {
            out.cost_per_million_tokens =
                out.tokens_total && out.total_usage != null ? (out.total_usage / out.tokens_total) * 1e6 : null;
        }

        return out;
    })
    .filter((row) => row.date);
