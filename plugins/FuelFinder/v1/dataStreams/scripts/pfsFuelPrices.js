// GET /api/v1/pfs/fuel-prices returns a bare root array of stations, each
// carrying a fuel_prices list; one flat row per station. These become
// "Fuel Price" objects - a separate object type from Fuel Station, keyed by
// the same node_id, so the two import steps cannot overwrite each other's
// properties (a second write to the SAME object replaces its property bag).
// Shaping-time objectPropertyPath lookups join the two types for dashboards.
const stations = Array.isArray(data) ? data : [];

// Fuel codes seen in the wild; unknown future codes are ignored rather than
// invented as columns.
const fuelColumn = {
    E10: "priceE10",
    E5: "priceE5",
    B7_STANDARD: "priceB7",
    B7_PREMIUM: "priceB7Premium",
};

result = stations.map((s) => {
    const row = {
        node_id: s.node_id,
        name: s.trading_name || s.mft_organisation_name || s.node_id,
        sourceType: "Fuel Price",
        priceE10: null,
        priceE10ChangedAt: null,
        priceE5: null,
        priceE5ChangedAt: null,
        priceB7: null,
        priceB7ChangedAt: null,
        priceB7Premium: null,
        priceB7PremiumChangedAt: null,
        pricesUpdated: null,
    };
    for (const entry of s.fuel_prices || []) {
        const col = fuelColumn[entry.fuel_type];
        if (!col || !Number.isFinite(entry.price)) continue;
        row[col] = entry.price;
        row[`${col}ChangedAt`] = entry.price_change_effective_timestamp || entry.price_last_updated || null;
        const changed = row[`${col}ChangedAt`];
        if (changed && (!row.pricesUpdated || changed > row.pricesUpdated)) {
            row.pricesUpdated = changed;
        }
    }
    return row;
});
