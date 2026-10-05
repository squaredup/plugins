// Normalises analytics rows: the time key is suffixed with the granularity
// (date__day, or created_at__day for raw-view fields like latency and provider)
// and large counts arrive as strings. cost_per_million_tokens isn't an OpenRouter
// metric; it's derived from total_usage and tokens_total, requested together.
const body = data?.data ?? {};
const metric = context.config.metric || 'total_usage';
const groupBy = context.config.groupBy;

if (body.metadata?.truncated) {
    api.report.warning(
        'Results were truncated by OpenRouter; narrow the timeframe or filter to specific objects',
    );
}

const costPerMillionTokens = (row) => {
    const tokens = Number(row.tokens_total ?? 0);
    return tokens && row.total_usage != null ? (Number(row.total_usage) / tokens) * 1e6 : null;
};

const dateKey = (row) => Object.keys(row).find((k) => /__(minute|hour|day|week|month)$/.test(k));

result = (body.data ?? [])
    .map((row) => {
        const date = row[dateKey(row)];
        if (!date) return null;

        const value = metric === 'cost_per_million_tokens' ? costPerMillionTokens(row) : row[metric];

        return {
            date,
            group: groupBy ? row[groupBy] : null,
            value: value == null ? null : Number(value),
        };
    })
    .filter(Boolean);
