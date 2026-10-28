// GET /api/v1/pfs returns a bare root array of stations (no envelope); each page is passed in separately
const stations = Array.isArray(data) ? data : [];

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
