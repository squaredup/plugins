// GET /api/v1/pfs/fuel-prices?effective-start-timestamp=... returns a bare root array of stations that had a price change since that time; each page is passed in separately
const stations = Array.isArray(data) ? data : [];

// Keep only the scoped stations - rawId is the station node_id
const scopedIds = new Set((context.objects || []).map((o) => o.rawId).filter(Boolean));

// Keep only entries that changed within the timeframe (the API can include fuels unchanged since the start)
const start = new Date(context.timeframe.start).getTime();
const end = new Date(context.timeframe.end).getTime();
const inTimeframe = (ts) => {
    const t = new Date(ts).getTime();
    return Number.isFinite(t) && t >= start && t <= end;
};

result = stations
    .filter((s) => scopedIds.has(s.node_id))
    .flatMap((s) =>
        (s.fuel_prices || [])
            .filter(
                (p) =>
                    p &&
                    p.price !== null &&
                    p.price !== "" &&
                    Number.isFinite(Number(p.price)) &&
                    inTimeframe(p.price_change_effective_timestamp),
            )
            .map((p) => ({
                stationId: s.node_id,
                stationName: s.trading_name || s.mft_organisation_name || s.node_id,
                fuelType: p.fuel_type,
                price: Number(p.price),
                changedAt: p.price_change_effective_timestamp,
            })),
    );
