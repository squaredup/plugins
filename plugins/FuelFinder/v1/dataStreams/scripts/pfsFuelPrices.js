// GET /api/v1/pfs/fuel-prices returns a bare root array of stations, each
// carrying a fuel_prices list. The import writes a full property set per
// object, so each price row is joined with the station properties carried by
// the scoped objects (imported by the stations step this step dependsOn) -
// a second step writing the same object replaces its properties rather than
// merging, so this step must write the union.
const stations = Array.isArray(data) ? data : [];

// User-defined indexed properties can arrive as single-element arrays.
const unwrap = (v) => (Array.isArray(v) && v.length <= 1 ? v[0] : v);

const stationProps = new Map();
for (const obj of context.objects || []) {
    stationProps.set(obj.rawId, {
        brand: unwrap(obj.brand) ?? "",
        addressLine1: unwrap(obj.addressLine1) ?? "",
        city: unwrap(obj.city) ?? "",
        postcode: unwrap(obj.postcode) ?? "",
        postcodeArea: unwrap(obj.postcodeArea) ?? "",
        latitude: unwrap(obj.latitude) ?? null,
        longitude: unwrap(obj.longitude) ?? null,
        fuelTypes: Array.isArray(obj.fuelTypes) ? obj.fuelTypes : [],
        amenities: Array.isArray(obj.amenities) ? obj.amenities : [],
        isMotorway: unwrap(obj.isMotorway) === true,
        isSupermarket: unwrap(obj.isSupermarket) === true,
    });
}

// Fuel codes seen in the wild; unknown future codes are ignored rather than
// invented as columns.
const fuelColumn = {
    E10: "priceE10",
    E5: "priceE5",
    B7_STANDARD: "priceB7",
    B7_PREMIUM: "priceB7Premium",
};

result = stations
    .filter((s) => stationProps.has(s.node_id))
    .map((s) => {
        const row = {
            node_id: s.node_id,
            name: s.trading_name || s.mft_organisation_name || s.node_id,
            sourceType: "Fuel Station",
            ...stationProps.get(s.node_id),
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
