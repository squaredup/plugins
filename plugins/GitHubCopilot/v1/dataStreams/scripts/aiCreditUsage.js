// The billing usage endpoint returns one period per call (a month when `day` is omitted), so the stream walks the
// timeframe one period at a time. The next period's URL is handed back as the paging context until the period
// would start after the end of the timeframe (or now, whichever is earlier). Only last7days iterates days: each
// request takes about 0.75s and the stream is cut off after about 12s (roughly 16 requests), so every longer
// timeframe iterates months instead.
const params = url.searchParams;
const year = Number(params.get('year'));
const month = Number(params.get('month')) || 1;
const day = Number(params.get('day')) || 1;
const isMonthly = !params.get('day');

const pad = (n) => String(n).padStart(2, '0');
const period = isMonthly ? `${year}-${pad(month)}-01` : `${year}-${pad(month)}-${pad(day)}`;

const limit = Math.min(new Date(context.timeframe.end).getTime(), Date.now());
const next = isMonthly ? new Date(Date.UTC(year, month, 1)) : new Date(Date.UTC(year, month - 1, day + 1));

if (next.getTime() < limit) {
    params.set('year', String(next.getUTCFullYear()));
    params.set('month', String(next.getUTCMonth() + 1));
    if (isMonthly) {
        params.delete('day');
    } else {
        params.set('day', String(next.getUTCDate()));
    }
    pagingContext = url.toString();
} else {
    pagingContext = undefined;
}

result = (data?.usageItems || []).map((item) => ({
    period,
    product: item.product ?? null,
    sku: item.sku ?? null,
    model: item.model ?? null,
    unitType: item.unitType ?? null,
    pricePerUnit: item.pricePerUnit ?? null,
    grossQuantity: item.grossQuantity ?? null,
    grossAmount: item.grossAmount ?? null,
    discountQuantity: item.discountQuantity ?? null,
    discountAmount: item.discountAmount ?? null,
    netQuantity: item.netQuantity ?? null,
    netAmount: item.netAmount ?? null,
    costCenter: data?.costCenter?.name ?? null
}));
