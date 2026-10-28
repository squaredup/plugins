// Union import, paged for output size: the pipeline walks the station batches
// (one page = one batch of 500; a full page of union rows stays far below the
// ~6MB response cap - emitting the whole dataset at once does not). The price
// dataset has no location data, no filters, and does NOT align its batches
// with the stations endpoint, so each page's script re-fetches every price
// batch directly (same-host fetches run from the relay agent at under 100ms
// each) and joins by node_id.
const BATCH = 500;
const MAX_BATCHES = 40; // runaway guard; ~17 expected
const base = context.dataSources[0].baseUrl.replace(/\/*$/, "");

// There is no usable delay in this sandbox: setTimeout's timers never fire
// (an awaited setTimeout hangs until the 20s script cap kills the run) and
// the clock does not advance inside a synchronous loop, so a busy-wait never
// exits. The only thing that takes real time is a fetch, so backoff after a
// 429 is a handful of cheap unauthenticated favicon requests (~80ms each).
const backoff = async (rounds) => {
    for (let i = 0; i < rounds; i++) {
        await fetch(`${base}/favicon.ico`).catch(() => {});
    }
};

// Reuse the token the pre-request script just cached (state is shared);
// mint only when it is missing or stale, and write the mint back so the
// token economy stays single-token (minting revokes earlier tokens).
let token = typeof state?.token === "string" && (state?.expiryTime ?? 0) > Date.now() ? state.token : null;
if (!token) {
    const resp = await fetch(`${base}/api/v1/oauth/generate_access_token`, {
        method: "post",
        headers: { Accept: "application/json", "Content-Type": "application/json" },
        body: JSON.stringify({ client_id: secrets.clientId, client_secret: secrets.clientSecret }),
    });
    let payload = {};
    try {
        payload = await resp.json();
    } catch (e) {
        // non-JSON body; the check below reports the status
    }
    const minted = payload?.data?.access_token ?? payload?.access_token;
    if (!resp.ok || typeof minted !== "string") {
        throw new Error(`Fuel Finder token mint failed: HTTP ${resp.status}`);
    }
    token = minted;
    state = {
        ...state,
        token,
        expiryTime: Date.now() + (payload?.data?.expires_in ?? 3600) * 1000 - 60000,
    };
}

// Walk every price batch (~17 of them). With ~17 output pages each doing
// this, a full import makes ~300 API requests over ~2 minutes; the limiter
// tolerates the bursts and any 429 gets a backoff-and-retry.
const pricesById = new Map();
let retries = 0;
for (let n = 1; n <= MAX_BATCHES; n++) {
    const r = await fetch(`${base}/api/v1/pfs/fuel-prices?batch-number=${n}`, {
        headers: { Accept: "application/json", Authorization: `Bearer ${token}` },
    });
    if (r.status === 404 && n > 1) break; // dataset size was an exact multiple of BATCH
    if (r.status === 429) {
        if (++retries > 10) throw new Error(`Fuel Finder rate limit: batch ${n} still 429 after ${retries} retries`);
        await backoff(15 * retries);
        n--; // retry the same batch after the limiter cools off
        continue;
    }
    if (!r.ok) throw new Error(`Fuel Finder fuel-prices batch ${n} failed: HTTP ${r.status}`);
    const rows = await r.json();
    if (!Array.isArray(rows)) throw new Error(`Fuel Finder fuel-prices batch ${n} returned a non-array body`);
    for (const p of rows) pricesById.set(p.node_id, p.fuel_prices || []);
    if (rows.length < BATCH) break;
}

// Fuel codes seen in the wild; unknown future codes are ignored rather than
// invented as columns.
const fuelColumn = {
    E10: "priceE10",
    E5: "priceE5",
    B7_STANDARD: "priceB7",
    B7_PREMIUM: "priceB7Premium",
};

const stations = Array.isArray(data) ? data : [];
result = stations
    .filter((s) => !s.permanent_closure)
    .filter((s) => typeof s.location?.latitude === "number" && typeof s.location?.longitude === "number")
    .map((s) => {
        const row = {
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
        for (const entry of pricesById.get(s.node_id) || []) {
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
