// The API response (GET api/v1/pfs, one page) is ignored: the request only exists because a stream needs one.
// Rows come from the scoped stations' indexed properties (price and price-changed-at per fuel).

// User-defined graph properties arrive as single-element arrays; rawId and name are scalars
const unwrap = (v) => (Array.isArray(v) ? v[0] : v);

const FUELS = [
    { fuelType: "E10", priceProp: "priceE10", changedProp: "priceE10ChangedAt" },
    { fuelType: "E5", priceProp: "priceE5", changedProp: "priceE5ChangedAt" },
    { fuelType: "B7_STANDARD", priceProp: "priceB7", changedProp: "priceB7ChangedAt" },
    { fuelType: "B7_PREMIUM", priceProp: "priceB7Premium", changedProp: "priceB7PremiumChangedAt" },
];

const start = new Date(context.timeframe.start).getTime();
const end = new Date(context.timeframe.end).getTime();

result = (context.objects || []).flatMap((station) =>
    FUELS.flatMap((fuel) => {
        const changedAt = unwrap(station[fuel.changedProp]);
        const changedTime = new Date(changedAt).getTime();
        const rawPrice = unwrap(station[fuel.priceProp]);
        const price = rawPrice === null || rawPrice === undefined || rawPrice === "" ? NaN : Number(rawPrice);

        if (!changedAt || !Number.isFinite(changedTime) || changedTime < start || changedTime > end || !Number.isFinite(price)) {
            return [];
        }

        return [
            {
                stationId: station.rawId,
                stationName: station.name,
                fuelType: fuel.fuelType,
                price,
                changedAt,
                brand: unwrap(station.brand),
                postcodeArea: unwrap(station.postcodeArea),
            },
        ];
    }),
);
