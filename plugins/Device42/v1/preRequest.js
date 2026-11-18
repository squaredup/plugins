// Never `return` at the top level of this script. WebAPI pastes it inside the
// try block of its own function, ahead of that function's `return { url,
// headers, state, ... }`, so an early return hands WebAPI `undefined` and every
// request fails (on a relay agent, as "context.isPluginError is not a
// function"). Skip work with an if block instead.
//
// Device42 API clients exchange a client key and secret for a short-lived
// bearer token: POST /tauth/1.0/token/ with the key and secret as Basic auth.
// The response carries the token as `token` (not the OAuth2 `access_token`
// WebAPI's oauth2 mode requires), so the exchange is done here instead.
//
// The token is cached in `state` until shortly before its `expires` time.
//
// Token failures are reported with api.report.warning, never api.report.error
// or an uncaught throw. On a relay agent, any error raised from a script
// reaches WebAPIOnPremise's runScript catch, which calls context.isPluginError;
// the agent's NodeJSConnector doesn't provide it, so the real message is
// replaced by "TypeError: context.isPluginError is not a function". A warning
// survives, and the API call that follows (sent without a token) still fails.
//
// Up to WebAPI 1.11, this script's fetch always verifies TLS: the "Ignore
// certificate errors" setting does not reach it. A Device42 appliance whose
// certificate the relay agent's Node.js can't verify (an internal CA, or a
// server that doesn't send its intermediate) fails here with "unable to verify
// the first certificate". The fix is for the relay to trust the chain, for
// example with NODE_EXTRA_CA_CERTS on the relay agent service.

const now = Date.now();

const warn = (text) => api.report.warning(text);

// Node's fetch reports network and TLS failures as a bare "fetch failed"; the
// reason (e.g. UNABLE_TO_VERIFY_LEAF_SIGNATURE) is on err.cause.
const describe = (err) =>
    [err?.message ?? String(err), err?.cause?.code, err?.cause?.message].filter(Boolean).join(" | ");

const getToken = async () => {
    const baseUrl = String(context.dataSources[0].baseUrl || "").trim().replace(/\/+$/, "");
    const tokenUrl = `${baseUrl}/tauth/1.0/token/`;

    const clientKey = String(secrets.apiClientKey || "").trim();
    const clientSecret = String(secrets.apiClientSecret || "").trim();

    let response;
    try {
        response = await fetch(tokenUrl, {
            method: "post",
            headers: {
                Accept: "application/json",
                Authorization: `Basic ${btoa(`${clientKey}:${clientSecret}`)}`,
            },
        });
    } catch (err) {
        warn(`Could not reach the Device42 token endpoint ${tokenUrl}: ${describe(err)}`);
        return undefined;
    }

    if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
            warn(
                `Device42 rejected the API Client Key or Secret (HTTP ${response.status}). ` +
                    "Check both values, and that the API client is enabled in Device42."
            );
        } else if (response.status === 404) {
            warn(
                `Device42 token endpoint was not found at ${tokenUrl} (HTTP 404). Check the Device42 URL.`
            );
        } else {
            warn(
                `Could not get a Device42 token from ${tokenUrl}: HTTP ${response.status} ${response.statusText}`
            );
        }
        return undefined;
    }

    let payload;
    try {
        payload = await response.json();
    } catch (err) {
        warn(`Device42 token endpoint returned a response that isn't JSON: ${describe(err)}`);
        return undefined;
    }

    if (typeof payload?.token !== "string" || !payload.token) {
        warn(`Device42 token endpoint returned no token${payload?.msg ? `: ${payload.msg}` : ""}.`);
        return undefined;
    }

    // `expires` is the server's ISO timestamp. Reuse the token until a minute
    // before it when the lifetime allows, otherwise until halfway there, and
    // never past it. Only an unknown expiry falls back to five minutes.
    const expiresAt = Date.parse(payload.expires);
    const remaining = expiresAt - now;
    let expiryTime;
    if (!Number.isFinite(expiresAt)) {
        expiryTime = now + 300000;
    } else if (remaining > 120000) {
        expiryTime = expiresAt - 60000;
    } else {
        expiryTime = now + Math.max(0, remaining) / 2;
    }

    return { token: payload.token, expiryTime };
};

// A cached token is reused only before its deadline. A token fetched for this
// request is always sent, even if its deadline has already passed (for
// example a clock ahead of Device42's): it won't be reused, so the next
// request fetches another.
let token = typeof state?.token === "string" && (state?.expiryTime ?? 0) > now ? state.token : undefined;

if (!token) {
    const fresh = await getToken();
    if (fresh) {
        state = { ...state, ...fresh };
        token = fresh.token;
    }
}

if (token) {
    headers["Authorization"] = `Bearer ${token}`;
}
