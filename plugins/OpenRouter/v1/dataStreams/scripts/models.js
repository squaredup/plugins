// Optional `models` object-picker parameter: selected objects arrive at
// context.config.models as an array, each rawId a single-element array.
// Empty/absent (including the import run) returns every model.
const unwrap = (v) => (Array.isArray(v) ? v[0] : v);
const selected = context.config?.models ?? [];
const ids = new Set(selected.map((o) => unwrap(o.rawId)).filter(Boolean));

// Affordability scores price per 1M tokens on a log scale so "higher is better"
// alongside the benchmark indices: 100 at FLOOR or less, 0 at the ceiling or more.
// The ceiling is the optional `affordabilityCeiling` parameter; an unset value or
// one under the field's minimum uses the default. Keep MIN_CEILING and
// DEFAULT_CEILING in sync with that field's validation.min and defaultValue.
const FLOOR = 0.01;
const MIN_CEILING = 1;
const DEFAULT_CEILING = 1000;
const requested = Number(context.config?.affordabilityCeiling);
const ceiling = Number.isFinite(requested) && requested >= MIN_CEILING ? requested : DEFAULT_CEILING;
const span = Math.log10(ceiling / FLOOR);

// Per-token price string to a 0-100 score; null when missing, non-numeric or
// negative (variable pricing). Free models score Infinity, clamped to 100.
const affordability = (perToken) => {
    const price = perToken == null || String(perToken).trim() === '' ? NaN : Number(perToken) * 1e6;
    if (!Number.isFinite(price) || price < 0) {
        return null;
    }

    return Math.min(100, Math.max(0, (100 * Math.log10(ceiling / price)) / span));
};

const models = data?.data ?? [];
result = (ids.size ? models.filter((m) => ids.has(m.id)) : models).map((m) => ({
    ...m,
    inputAffordability: affordability(m.pricing?.prompt),
    outputAffordability: affordability(m.pricing?.completion),
    cacheReadAffordability: affordability(m.pricing?.input_cache_read)
}));
