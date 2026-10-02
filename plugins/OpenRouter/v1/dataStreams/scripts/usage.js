// Normalises analytics rows: the time key is named after the granularity
// (date__day, date__hour, ...) and large counts arrive as strings.
const body = data?.data ?? {};
const metric = context.config.metric || 'total_usage';
const groupBy = context.config.groupBy;

if (body.metadata?.truncated) {
    api.report.warning(
        'Results were truncated by OpenRouter; narrow the timeframe or filter to specific objects',
    );
}

const dateKey = (row) => Object.keys(row).find((k) => k.startsWith('date__'));

result = (body.data ?? [])
    .map((row) => {
        const date = row[dateKey(row)];
        if (!date) return null;

        const value = row[metric];

        return {
            date,
            group: groupBy ? row[groupBy] : null,
            value: value == null ? null : Number(value),
        };
    })
    .filter(Boolean);
