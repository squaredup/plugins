// The PFS endpoints wrap their payload twice: { success, data: { success, data: [...] } }
const stations = Array.isArray(data) ? data : Array.isArray(data?.data) ? data.data : (data?.data?.data ?? []);

// Home location comes from the configured postcode, geocoded via postcodes.io
// (free, no auth, not geo-restricted).
const dsConfig = (context.dataSources && context.dataSources[0]) || {};
const postcode = dsConfig.postcode;
const radiusMiles = Number(dsConfig.radiusMiles) || 5;
if (typeof fetch !== "function") {
    throw new Error("fetch is not available in this script context - cannot geocode the configured postcode");
}
if (!postcode) {
    throw new Error("No postcode found on the data source config (checked context.dataSources[0].postcode)");
}
const geoResp = await fetch(`https://api.postcodes.io/postcodes/${encodeURIComponent(postcode.trim())}`);
const geo = await geoResp.json();
if (!geoResp.ok || !geo?.result) {
    throw new Error(`Could not geocode postcode "${postcode}": ${geo?.error || `HTTP ${geoResp.status}`}`);
}
const homeLat = geo.result.latitude;
const homeLng = geo.result.longitude;

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
