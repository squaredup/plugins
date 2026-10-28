// The API response is deliberately IGNORED. The stream calls GET favicon.ico (one cheap unauthenticated 200) only
// because a stream must call something; every row below is built from the scoped stations' indexed properties.
// Prices are joined from the "Fuel Price" objects at shaping time (objectPropertyPath columns in the stream metadata).

// Indexed properties arrive in scripts as single-element arrays; rawId and name are scalars
const prop = (p) => (Array.isArray(p) ? p[0] : p);
const toNumber = (v) => {
    const raw = prop(v);
    if (raw === null || raw === undefined || raw === "") return null;
    const n = Number(raw);
    return Number.isFinite(n) ? n : null;
};
const toBoolean = (v) => {
    const raw = prop(v);
    if (raw === null || raw === undefined || raw === "") return null;
    return raw === true || String(raw).toLowerCase() === "true";
};
const toText = (v) => {
    const raw = prop(v);
    return raw === null || raw === undefined ? null : String(raw);
};

// Optional location filter (stream params); both coordinates must parse or no distance is computed
const config = context.config || {};
const originLat = toNumber(config.latitude);
const originLon = toNumber(config.longitude);
const hasOrigin = originLat !== null && originLon !== null;
const radius = hasOrigin ? toNumber(config.radiusMiles) : null;

const EARTH_RADIUS_MILES = 3958.8;
const toRadians = (deg) => (deg * Math.PI) / 180;
const haversineMiles = (lat1, lon1, lat2, lon2) => {
    const dLat = toRadians(lat2 - lat1);
    const dLon = toRadians(lon2 - lon1);
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLon / 2) ** 2;
    return 2 * EARTH_RADIUS_MILES * Math.asin(Math.min(1, Math.sqrt(a)));
};

const rows = (context.objects || []).flatMap((station) => {
    const latitude = toNumber(station.latitude);
    const longitude = toNumber(station.longitude);

    let distanceMiles = null;
    if (hasOrigin && latitude !== null && longitude !== null) {
        distanceMiles = Math.round(haversineMiles(originLat, originLon, latitude, longitude) * 10) / 10;
    }
    // With a radius set, drop stations that are too far away or whose distance cannot be determined
    if (radius !== null && (distanceMiles === null || distanceMiles > radius)) return [];

    return [
        {
            stationId: station.rawId,
            stationName: station.name,
            brand: toText(station.brand),
            city: toText(station.city),
            postcodeArea: toText(station.postcodeArea),
            distanceMiles,
            latitude,
            longitude,
            isMotorway: toBoolean(station.isMotorway),
            isSupermarket: toBoolean(station.isSupermarket),
        },
    ];
});

// Optional minBrandStations param: drop rows whose brand has fewer than N
// stations in scope. Cross-row logic the tile cannot express (its filter runs
// before grouping), used by brand-league style tiles to hide one-off brands.
const minBrandStations = toNumber(config.minBrandStations);
if (minBrandStations !== null && minBrandStations > 1) {
    const brandCounts = new Map();
    for (const r of rows) {
        if (r.brand) brandCounts.set(r.brand, (brandCounts.get(r.brand) || 0) + 1);
    }
    result = rows.filter((r) => r.brand && (brandCounts.get(r.brand) || 0) >= minBrandStations);
} else {
    result = rows;
}
