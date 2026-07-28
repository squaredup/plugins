// Optional `position` object-picker parameter (stream `ui` name "position").
// Selected objects arrive at context.config.position as an ARRAY, each rawId
// a single-element array. Empty/absent -> account-wide, no filter.
const unwrap = (v) => (Array.isArray(v) ? v[0] : v);
const selected = (context.config && context.config.position) || [];
const tickers = new Set(selected.map((o) => unwrap(o.rawId)).filter(Boolean));

const rows = (data || []).map((o) => ({
    id: o.id,
    ticker: o.ticker,
    name: o.instrument && o.instrument.name,
    isin: o.instrument && o.instrument.isin,
    instrumentCurrency: o.instrument && o.instrument.currency,
    type: o.type,
    side: o.side,
    status: o.status,
    quantity: o.quantity,
    filledQuantity: o.filledQuantity,
    limitPrice: o.limitPrice,
    stopPrice: o.stopPrice,
    currency: o.currency,
    extendedHours: o.extendedHours,
    initiatedFrom: o.initiatedFrom,
    timeInForce: o.timeInForce,
    strategy: o.strategy,
    createdAt: o.createdAt,
}));

result = tickers.size ? rows.filter((r) => tickers.has(r.ticker)) : rows;
