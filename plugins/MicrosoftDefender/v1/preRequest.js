// Most streams call Microsoft Graph with the built-in OAuth2 token. Vulnerability data without
// advanced hunting only exists on the Microsoft Defender for Endpoint API, which needs a token
// for its own audience, and the built-in OAuth2 issues a single Graph token. Streams for that
// API therefore use an "mde/" endpoint path, which this script reroutes to the Defender for
// Endpoint host, then authenticates with a second client credentials token cached in `state`.
// Every other request is left untouched.

const MDE_HOST = "api.securitycenter.microsoft.com";
const MDE_SCOPE = "https://api.securitycenter.microsoft.com/.default";
const MDE_MARKER = "/security/mde/";

const markerIndex = url.pathname.indexOf(MDE_MARKER);

// Requests that already target the Defender for Endpoint host (paging links) still need the token.
if (markerIndex === -1 && url.hostname !== MDE_HOST) {
    return;
}

if (markerIndex !== -1) {
    url.hostname = MDE_HOST;
    url.pathname = `/api/${url.pathname.slice(markerIndex + MDE_MARKER.length)}`;
}

// --- token -----------------------------------------------------------------------

if (typeof state?.mdeToken !== "string" || (state?.mdeExpiryTime ?? 0) <= Date.now()) {
    const tenantId = String(secrets.tenantId || "").trim();

    const response = await fetch(
        `https://login.microsoftonline.com/${encodeURIComponent(tenantId)}/oauth2/v2.0/token`,
        {
            method: "post",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams({
                grant_type: "client_credentials",
                client_id: String(secrets.clientId || "").trim(),
                client_secret: String(secrets.clientSecret || ""),
                scope: MDE_SCOPE
            }).toString()
        }
    );

    if (!response.ok) {
        // Entra ID error descriptions end with trace and correlation IDs; keep the first line.
        let detail = "";
        try {
            const error = await response.json();
            detail = String(error?.error_description || error?.error || "").split(/\r?\n/)[0];
        } catch {
            detail = response.statusText;
        }
        api.report.error(
            `Could not get a token for the Microsoft Defender for Endpoint API (HTTP ${response.status}). ` +
                "Check the tenant ID, client ID and secret, that the app has the WindowsDefenderATP " +
                "'Vulnerability.Read.All' application permission with admin consent, and that Defender for " +
                `Endpoint or Defender for Business is set up in the tenant. ${detail}`.trim()
        );
        return;
    }

    const payload = await response.json();
    if (typeof payload?.access_token !== "string") {
        api.report.error("Microsoft Entra ID returned no access token for the Microsoft Defender for Endpoint API.");
        return;
    }

    const lifetimeMs = typeof payload.expires_in === "number" ? payload.expires_in * 1000 : 3600000;
    state = {
        ...state,
        mdeToken: payload.access_token,
        // Refresh 5 minutes early so a long paged request can't expire mid-flight.
        mdeExpiryTime: Date.now() + lifetimeMs - Math.min(300000, Math.floor(lifetimeMs / 2))
    };
}

// --- request ---------------------------------------------------------------------

// Replace the Graph token, whatever casing the header was added with.
for (const key of Object.keys(headers)) {
    if (key.toLowerCase() === "authorization") {
        delete headers[key];
    }
}
headers["Authorization"] = `Bearer ${state.mdeToken}`;
