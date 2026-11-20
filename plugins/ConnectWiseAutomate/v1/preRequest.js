// ConnectWise Automate authenticates by exchanging a username and password for a
// short-lived bearer token via POST /cwa/api/v1/apitoken (about an hour).
//
// The token is cached in `state` with a fingerprint of the credentials it was issued
// for, so editing the data source configuration forces a fresh login.

url.pathname = url.pathname.replace(/\/{2,}/g, "/");

const serverUrl = String(secrets.serverUrl || "")
    .trim()
    .replace(/\/+$/, "");
const username = String(secrets.username || "").trim();
const password = String(secrets.password || "");
const clientId = String(secrets.clientId || "").trim();

// Not a security control, just a change detector for cached tokens. Bump the leading
// version when the caching rules change so existing cached tokens are discarded.
const fingerprint = `v2|${serverUrl}|${username}|${clientId}|${password.length}`;

if (
    typeof state?.token !== "string" ||
    state?.fingerprint !== fingerprint ||
    (state?.expiryTime ?? 0) <= Date.now()
) {
    if (!serverUrl || !username || !password || !clientId) {
        api.report.error("ConnectWise Automate server URL, username, password and client ID are all required.");
        return;
    }

    const authUrl = `${serverUrl}/cwa/api/v1/apitoken`;
    let response;
    try {
        response = await fetch(authUrl, {
            method: "post",
            headers: {
                Accept: "application/json",
                "Content-Type": "application/json",
                clientId,
            },
            body: JSON.stringify({ UserName: username, Password: password }),
        });
    } catch (error) {
        api.report.error(
            `Could not reach ConnectWise Automate at ${serverUrl}: ${error?.message ?? error}. ` +
                "Check the server URL, and for an on-premises server make sure the data source runs on an agent that can reach it.",
        );
        return;
    }

    if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
            api.report.error(
                `ConnectWise Automate rejected the credentials (HTTP ${response.status}). ` +
                    "Check the username and password, and that the user is allowed to use the REST API.",
            );
        } else if (response.status === 400) {
            api.report.error(
                "ConnectWise Automate rejected the login request (HTTP 400). Check the client ID is valid.",
            );
        } else if (response.status === 404) {
            api.report.error(
                `ConnectWise Automate's API was not found at ${authUrl} (HTTP 404). ` +
                    "Enter the server's base address only, e.g. https://yourcompany.hostedrmm.com.",
            );
        } else {
            api.report.error(
                `Could not get a ConnectWise Automate access token: HTTP ${response.status} ${response.statusText}`,
            );
        }
        return;
    }

    let payload;
    try {
        payload = await response.json();
    } catch {
        api.report.error(
            "ConnectWise Automate returned a response that isn't JSON. Check the server URL points at the Automate server.",
        );
        return;
    }

    if (payload?.IsTwoFactorRequired === true && !payload?.AccessToken) {
        api.report.error(
            "This ConnectWise Automate user requires two-factor authentication. " +
                "Use an integrator account, which isn't subject to 2FA.",
        );
        return;
    }

    const token = payload?.AccessToken ?? payload?.accessToken;
    if (typeof token !== "string" || !token) {
        api.report.error("ConnectWise Automate accepted the login but returned no access token.");
        return;
    }

    // ExpirationDate may be in the server's local time with no offset, so it can only shorten
    // the cache lifetime, never extend it. The cap is well under the token's hour because this
    // script can't see a 401: if the server stops honouring a token early, requests fail
    // until the cached copy expires, so keep that window short.
    const MAX_CACHE_MS = 15 * 60000;
    const reported = Date.parse(payload?.ExpirationDate ?? "") - Date.now();
    const lifetimeMs = Number.isFinite(reported) && reported > 0 ? Math.min(reported, MAX_CACHE_MS) : MAX_CACHE_MS;
    const refreshMarginMs = Math.min(300000, Math.floor(lifetimeMs / 2));

    state = {
        ...state,
        token,
        fingerprint,
        expiryTime: Date.now() + lifetimeMs - refreshMarginMs,
    };
}

headers["Authorization"] = `Bearer ${state.token}`;
headers["clientId"] = clientId;
