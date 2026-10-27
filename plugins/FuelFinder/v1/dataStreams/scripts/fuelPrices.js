// GET /api/v1/pfs/fuel-prices returns a bare root array of stations (no envelope); each page is passed in separately
const stations = Array.isArray(data) ? data : [];

// Keep only the scoped stations - rawId is the station node_id
const scopedIds = new Set((context.objects || []).map((o) => o.rawId).filter(Boolean));

result = stations
    .filter((s) => scopedIds.has(s.node_id))
    .flatMap((s) =>
        (s.fuel_prices || [])
            .filter((p) => p && p.price !== null && p.price !== "" && Number.isFinite(Number(p.price)))
            .map((p) => ({
                stationId: s.node_id,
                stationName: s.trading_name || s.mft_organisation_name || s.node_id,
                fuelType: p.fuel_type,
                price: Number(p.price),
                lastUpdated: p.price_last_updated,
            })),
    );
