// GET /api/v1/pfs returns a bare root array of stations (no envelope); each page is passed in separately
const stations = Array.isArray(data) ? data : [];

// Home location comes straight from the configured latitude/longitude -
// script fetch() is restricted to the data source's own host, so a geocoding
// service cannot be called from here.
const dsConfig = (context.dataSources && context.dataSources[0]) || {};
const homeLat = Number(dsConfig.latitude);
const homeLng = Number(dsConfig.longitude);
const radiusMiles = Number(dsConfig.radiusMiles) || 5;
if (!Number.isFinite(homeLat) || !Number.isFinite(homeLng)) {
    throw new Error("Latitude/Longitude are not set - edit the data source config and fill in both fields");
}

const toRad = (deg) => (deg * Math.PI) / 180;
const distanceMiles = (lat, lng) => {
    const dLat = toRad(lat - homeLat);
    const dLng = toRad(lng - homeLng);
    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(toRad(homeLat)) * Math.cos(toRad(lat)) * Math.sin(dLng / 2) ** 2;
    return 3958.8 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

result = stations
    .filter((s) => !s.permanent_closure)
    .filter((s) => typeof s.location?.latitude === "number" && typeof s.location?.longitude === "number")
    .map((s) => ({
        node_id: s.node_id,
        name: s.trading_name || s.brand_name || s.mft_organisation_name || s.node_id,
        sourceType: "Fuel Station",
        brand: s.brand_name || "",
        addressLine1: s.location.address_line_1 || "",
        city: s.location.city || "",
        postcode: s.location.postcode || "",
        latitude: s.location.latitude,
        longitude: s.location.longitude,
        distanceMiles: Math.round(distanceMiles(s.location.latitude, s.location.longitude) * 10) / 10,
        fuelTypes: (s.fuel_types || []).filter((f) => typeof f === "string"),
        amenities: (s.amenities || []).filter((a) => typeof a === "string"),
        isMotorway: s.is_motorway_service_station === true,
        isSupermarket: s.is_supermarket_service_station === true,
    }))
    .filter((s) => s.distanceMiles <= radiusMiles);
