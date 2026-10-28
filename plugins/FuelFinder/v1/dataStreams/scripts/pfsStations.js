// GET /api/v1/pfs returns a bare root array of stations (no envelope); each
// page is passed in separately. Prices live on sibling "Fuel Price" objects
// (imported by their own step from the prices endpoint) and are joined at
// shaping time via objectPropertyPath, so this stream stays a plain walk.
const stations = Array.isArray(data) ? data : [];

// brand_name is free text and inconsistent: trailing spaces, mixed case, and
// some operators (notably Asda) put the full site name in it, which explodes
// any group-by-brand view. Collapse known brands on a word-boundary prefix
// and tidy the rest.
const KNOWN_BRANDS = [
    ["ASDA", "Asda"],
    ["TESCO", "Tesco"],
    ["SAINSBURY", "Sainsbury's"],
    ["MORRISON", "Morrisons"],
    ["BP", "BP"],
    ["SHELL", "Shell"],
    ["ESSO", "Esso"],
    ["TEXACO", "Texaco"],
    ["JET", "JET"],
    ["GULF", "Gulf"],
    ["MURCO", "Murco"],
    ["VALERO", "Valero"],
    ["APPLEGREEN", "Applegreen"],
    ["MAXOL", "Maxol"],
    ["SPAR", "SPAR"],
    ["CO-OP", "Co-op"],
    ["COOP", "Co-op"],
    ["CO OP", "Co-op"],
    ["TOTALENERGIES", "TotalEnergies"],
    ["TOTAL", "TotalEnergies"],
    ["WELCOME BREAK", "Welcome Break"],
    ["MOTO", "Moto"],
    ["HARVEST", "Harvest Energy"],
    ["ESSAR", "Essar"],
    ["GLEANER", "Gleaner"],
];
const normaliseBrand = (raw) => {
    const cleaned = (raw || "").trim().replace(/\s+/g, " ");
    if (!cleaned) return "";
    const upper = cleaned.toUpperCase();
    for (const [prefix, canonical] of KNOWN_BRANDS) {
        if (upper === prefix || upper.startsWith(`${prefix} `) || upper.startsWith(`${prefix}'`)) {
            return canonical;
        }
    }
    // tidy the long tail: title-case fully-uppercase values, keep mixed case
    return upper === cleaned
        ? cleaned.toLowerCase().replace(/(^|[\s-])([a-z])/g, (m, sep, ch) => sep + ch.toUpperCase())
        : cleaned;
};

result = stations
    .filter((s) => !s.permanent_closure)
    .filter((s) => typeof s.location?.latitude === "number" && typeof s.location?.longitude === "number")
    .map((s) => ({
        node_id: s.node_id,
        name: s.trading_name || s.brand_name || s.mft_organisation_name || s.node_id,
        sourceType: "Fuel Station",
        brand: normaliseBrand(s.brand_name),
        addressLine1: s.location.address_line_1 || "",
        city: s.location.city || "",
        postcode: s.location.postcode || "",
        // outward-code area ("OX44 7BF" -> "OX") for regional grouping; some
        // feed postcodes lack the space, so take letters from the front
        postcodeArea: ((s.location.postcode || "").trim().match(/^[A-Za-z]{1,2}/) || [""])[0].toUpperCase(),
        latitude: s.location.latitude,
        longitude: s.location.longitude,
        fuelTypes: (s.fuel_types || []).filter((f) => typeof f === "string"),
        amenities: (s.amenities || []).filter((a) => typeof a === "string"),
        isMotorway: s.is_motorway_service_station === true,
        isSupermarket: s.is_supermarket_service_station === true,
    }));
