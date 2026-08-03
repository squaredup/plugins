// Optional `position` object-picker parameter (stream `ui` name "position").
// Selected objects arrive at context.config.position as an ARRAY, each rawId
// a single-element array. Empty/absent -> account-wide, no filter.
const unwrap = (v) => (Array.isArray(v) ? v[0] : v);
const selected = (context.config && context.config.position) || [];
const tickers = new Set(selected.map((o) => unwrap(o.rawId)).filter(Boolean));

const rows = (data || []).map((p) => ({
    ticker: p.instrument && p.instrument.ticker,
    name: p.instrument && p.instrument.name,
    isin: p.instrument && p.instrument.isin,
    instrumentCurrency: p.instrument && p.instrument.currency,
    quantity: p.quantity,
    quantityAvailableForTrading: p.quantityAvailableForTrading,
    quantityInPies: p.quantityInPies,
    currentPrice: p.currentPrice,
    averagePricePaid: p.averagePricePaid,
    walletCurrency: p.walletImpact && p.walletImpact.currency,
    totalCost: p.walletImpact && p.walletImpact.totalCost,
    currentValue: p.walletImpact && p.walletImpact.currentValue,
    unrealizedProfitLoss: p.walletImpact && p.walletImpact.unrealizedProfitLoss,
    fxImpact: p.walletImpact && p.walletImpact.fxImpact,
    createdAt: p.createdAt,
}));

result = tickers.size ? rows.filter((r) => tickers.has(r.ticker)) : rows;
