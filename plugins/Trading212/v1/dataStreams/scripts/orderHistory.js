// Optional `position` object-picker parameter (stream `ui` name "position").
// Selected objects arrive at context.config.position as an ARRAY, each rawId
// a single-element array. Empty/absent -> account-wide, no filter.
//
// NOTE ON PAGING: the endpoint's `nextPagePath` is a root-relative path
// (e.g. "/api/v0/equity/history/orders?cursor=...&limit=50&instrumentCode"),
// not an absolute URL and not a bare token. Neither the platform's "nextUrl"
// mode (requires an absolute URL, throws ERR_INVALID_URL on a relative one)
// nor "token" mode (sends the whole payload value verbatim as the next
// request's query arg -> API rejects it: "parameter 'cursor' is invalid.
// Expected: Long") can consume this shape, and there is no separate bare
// cursor field elsewhere in the payload or headers to extract instead. So
// paging is disabled here and `limit` is pinned to the API's max (50) via a
// plain getArg -- this stream returns only the most recent 50 orders.
const unwrap = (v) => (Array.isArray(v) ? v[0] : v);
const selected = (context.config && context.config.position) || [];
const tickers = new Set(selected.map((o) => unwrap(o.rawId)).filter(Boolean));

const rows = (data.items || []).map((item) => {
    const o = item.order || {};
    const f = item.fill || {};
    const wallet = f.walletImpact || {};
    const taxes = wallet.taxes || [];
    const fees = taxes.length
        ? -taxes.reduce((sum, t) => sum + (t.quantity || 0), 0)
        : null;
    // order.filledValue/order.value only exist for VALUE-strategy orders;
    // fill.walletImpact.netValue is present for every fill (QUANTITY or
    // VALUE strategy alike) and matches order.filledValue when both exist,
    // so it's the reliable source for "how much this order was worth".
    const filledValue =
        wallet.netValue !== undefined ? wallet.netValue : o.filledValue;

    return {
        id: o.id,
        ticker: o.ticker,
        name: o.instrument && o.instrument.name,
        isin: o.instrument && o.instrument.isin,
        instrumentCurrency: o.instrument && o.instrument.currency,
        type: o.type,
        strategy: o.strategy,
        side: o.side,
        status: o.status,
        orderedQuantity: o.quantity,
        filledQuantity: o.filledQuantity,
        orderedValue: o.value,
        filledValue: filledValue,
        fillPrice: f.price,
        limitPrice: o.limitPrice,
        stopPrice: o.stopPrice,
        accountCurrency: o.currency,
        realisedProfitLoss: wallet.realisedProfitLoss,
        fees: fees,
        fxRate: wallet.fxRate,
        tradingMethod: f.tradingMethod,
        extendedHours: o.extendedHours,
        initiatedFrom: o.initiatedFrom,
        dateCreated: o.createdAt,
        dateExecuted: f.filledAt || o.createdAt,
    };
});

result = tickers.size ? rows.filter((r) => tickers.has(r.ticker)) : rows;
