// N-central authenticates by exchanging a long-lived User-API Token (JWT)
// for a short-lived access token via POST /api/auth/authenticate.
//
// The access token is cached in `state` and reused until shortly before
// expiration. When expired, the User-API Token is exchanged again.
//
// The request path is also normalised to avoid duplicated slashes when
// the configured API base URL or endpoint contains a trailing slash.

url.pathname = url.pathname.replace(/\/{2,}/g, "/");

// --- token -----------------------------------------------------------------------

if (
    typeof state?.token !== "string" ||
    (state?.expiryTime ?? 0) <= Date.now()
) {
    const authUrl = `${String(secrets.apiBaseUrl|| "")
        .trim()
        .replace(/\/+$/, "")}/api/auth/authenticate`;

    const userApiToken = String(secrets.userApiToken || "").trim();

    if (!userApiToken) {
        api.report.error(
            "N-central User-API Token is not configured."
        );
        return;
    }

    const request = {
        method: "post",
        headers: {
            Accept: "application/json",
            Authorization: `Bearer ${userApiToken}`,
        },
    };

    const response = await fetch(authUrl, request);

    if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
            api.report.error(
                `N-central rejected the User-API Token (HTTP ${response.status}). ` +
                "Check that the User-API Token is valid and that the N-central account has API access."
            );
        } else if (response.status === 404) {
            api.report.error(
                `N-central authentication endpoint was not found at ${authUrl} (HTTP 404). ` +
                "Check the configured N-central API base URL."
            );
        } else {
            api.report.error(
                `Could not obtain an N-central access token: HTTP ${response.status} ${response.statusText}`
            );
        }

        return;
    }

    const payload = await response.json();

    const token = payload?.tokens?.access?.token;
    const expirySeconds = payload?.tokens?.access?.expirySeconds;

    if (!token) {
        api.report.error(
            "N-central returned a successful authentication response but no access token was found."
        );
        return;
    }

    const lifetimeMs =
        typeof expirySeconds === "number"
            ? expirySeconds * 1000
            : 3600000;

    state = {
        ...state,
        token,

        // Refresh 5 minutes before expiration so a long-running request
        // is less likely to fail because the token expires mid-flight.
        expiryTime: Date.now() + lifetimeMs - 300000,
    };
}

// --- request ---------------------------------------------------------------------

headers["Authorization"] = `Bearer ${state.token}`;