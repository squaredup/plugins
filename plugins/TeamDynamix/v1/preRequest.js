// TeamDynamix authenticates with a JWT obtained by POSTing a BEID / Web Services Key
// pair to /api/auth/loginadmin. No built-in authMode covers that exchange, so it happens
// here and the resulting token is cached in `state`.
//
// This script also does two things that aren't strictly authentication:
//
//  1. Request spacing. TeamDynamix rate limits are enforced per IP address, and the
//     tightest documented limit is 30 requests/60s on ticket and time-entry search
//     (most other endpoints allow 60/60s). A single import that walks several
//     applications can breach that on its own, so we hold a minimum gap between
//     consecutive requests rather than relying on the API to forgive us.
//
//  2. Path normalisation. The user pastes a full Web API address, which may or may not
//     have a trailing slash, so collapse any doubled separator before sending.

url.pathname = url.pathname.replace(/\/{2,}/g, "/");

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// The rate-limiting guide asks clients to wait until X-RateLimit-Reset and to enforce a
// 5 second floor on top, to absorb clock skew and time-zone differences.
const RATE_LIMIT_FLOOR_MS = 5000;

// --- request spacing -------------------------------------------------------------

// Ticket and time-entry search allow 30 req/60s (one per 2s); everything else 60 req/60s.
const isTightlyLimited = /\/(tickets|time)\/search\/?$/i.test(url.pathname);
const minGapMs = isTightlyLimited ? 2100 : 1100;

const sinceLastRequest = Date.now() - (state?.lastRequestAt ?? 0);
if (sinceLastRequest >= 0 && sinceLastRequest < minGapMs) {
    await sleep(minGapMs - sinceLastRequest);
}

// --- token -----------------------------------------------------------------------

// Read the lifetime out of the JWT's own `exp` claim rather than assuming the documented
// 24 hours: an instance configured with a shorter lifetime then still refreshes in time.
// Returns 0 if the token can't be decoded, which falls back to a conservative 12 hours.
const expiryFromJwt = (token) => {
    try {
        const segment = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
        const payload = JSON.parse(atob(segment));
        return typeof payload.exp === "number" ? payload.exp * 1000 : 0;
    } catch {
        return 0;
    }
};

if (typeof state?.token !== "string" || (state?.expiryTime ?? 0) <= Date.now()) {
    const authUrl = `${String(secrets.apiBaseUrl || "")
        .trim()
        .replace(/\/+$/, "")}/api/auth/loginadmin`;

    const request = {
        method: "post",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
            BEID: String(secrets.beid || "").trim(),
            WebServicesKey: String(secrets.webServicesKey || "").trim()
        })
    };

    let response = await fetch(authUrl, request);

    // The auth endpoint is itself rate limited (60/60s per IP). Retry once, honouring the
    // reset time the API reports, capped so a bad clock can't stall the request forever.
    if (response.status === 429) {
        const resetAt = Date.parse(response.headers.get("X-RateLimit-Reset") || "");
        const waitMs = Number.isNaN(resetAt)
            ? RATE_LIMIT_FLOOR_MS
            : Math.max(RATE_LIMIT_FLOOR_MS, resetAt - Date.now() + RATE_LIMIT_FLOOR_MS);
        await sleep(Math.min(waitMs, 65000));
        response = await fetch(authUrl, request);
    }

    if (!response.ok) {
        if (response.status === 400 || response.status === 401 || response.status === 403) {
            api.report.error(
                `TeamDynamix rejected the BEID and Web Services Key (HTTP ${response.status}). ` +
                    "Check both values on the organization detail page in TDAdmin, and that the " +
                    "admin service account is set to Active."
            );
        } else if (response.status === 404) {
            api.report.error(
                `No TeamDynamix Web API found at ${authUrl} (HTTP 404). Check the Web API address ` +
                    "ends in /TDWebApi (or /SBTDWebApi for a sandbox)."
            );
        } else {
            api.report.error(
                `Could not obtain a TeamDynamix token: HTTP ${response.status} ${response.statusText}`
            );
        }
        return;
    }

    // loginadmin returns the bare token rather than an object wrapping it. Instances have
    // been seen to send it both as a JSON-quoted string and as raw text, so read it as
    // text and strip any surrounding quotes instead of assuming a JSON body.
    const token = (await response.text()).trim().replace(/^"|"$/g, "");
    if (!token) {
        api.report.error("TeamDynamix returned an empty authentication token.");
        return;
    }

    const expiresAt = expiryFromJwt(token);
    state = {
        ...state,
        token,
        // Refresh 5 minutes early so a long-running import can't expire mid-flight.
        expiryTime: expiresAt ? expiresAt - 300000 : Date.now() + 12 * 60 * 60 * 1000
    };
}

headers["Authorization"] = `Bearer ${state.token}`;
state = { ...state, lastRequestAt: Date.now() };
