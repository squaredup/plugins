// Optional `position` object-picker parameter (stream `ui` name "position").
// Selected objects arrive at context.config.position as an ARRAY, each rawId
// a single-element array. Empty/absent -> account-wide, no filter.
const unwrap = (v) => (Array.isArray(v) ? v[0] : v);
const selected = (context.config && context.config.position) || [];
const tickers = new Set(selected.map((o) => unwrap(o.rawId)).filter(Boolean));

const rows = ((data && data.items) || []).map((d) => ({
    ticker: d.ticker || (d.instrument && d.instrument.ticker),
    instrumentName: d.instrument && d.instrument.name,
    amount: d.amount,
    grossAmountPerShare: d.grossAmountPerShare,
    quantity: d.quantity,
    type: d.type,
    paidOn: d.paidOn,
    reference: d.reference,
}));

result = tickers.size ? rows.filter((r) => tickers.has(r.ticker)) : rows;
