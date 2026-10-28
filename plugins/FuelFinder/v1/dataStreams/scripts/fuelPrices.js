// The API response is deliberately IGNORED. The stream calls GET api/v1/pfs (one cheap request) only because a
// stream must call something; every row below is built from the scoped stations' indexed properties instead.

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

const FUELS = [
    { code: "E10", price: "priceE10", changedAt: "priceE10ChangedAt" },
    { code: "E5", price: "priceE5", changedAt: "priceE5ChangedAt" },
    { code: "B7_STANDARD", price: "priceB7", changedAt: "priceB7ChangedAt" },
    { code: "B7_PREMIUM", price: "priceB7Premium", changedAt: "priceB7PremiumChangedAt" },
];

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

result = (context.objects || []).flatMap((station) => {
    const latitude = toNumber(station.latitude);
    const longitude = toNumber(station.longitude);

    let distanceMiles = null;
    if (hasOrigin && latitude !== null && longitude !== null) {
        distanceMiles = Math.round(haversineMiles(originLat, originLon, latitude, longitude) * 10) / 10;
    }
    // With a radius set, drop stations that are too far away or whose distance cannot be determined
    if (radius !== null && (distanceMiles === null || distanceMiles > radius)) return [];

    return FUELS.map((fuel) => ({ fuel, price: toNumber(station[fuel.price]) }))
        .filter(({ price }) => price !== null)
        .map(({ fuel, price }) => ({
            stationId: station.rawId,
            stationName: station.name,
            fuelType: fuel.code,
            price,
            lastUpdated: toText(station[fuel.changedAt]),
            distanceMiles,
            brand: toText(station.brand),
            city: toText(station.city),
            postcodeArea: toText(station.postcodeArea),
            isMotorway: toBoolean(station.isMotorway),
            isSupermarket: toBoolean(station.isSupermarket),
            latitude,
            longitude,
        }));
});
