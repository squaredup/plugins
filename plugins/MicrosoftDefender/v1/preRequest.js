// This plugin calls two APIs that need tokens for different audiences: Microsoft Graph for most
// streams, and the Microsoft Defender for Endpoint API for vulnerability data without advanced
// hunting. The built-in OAuth2 auth issues a single token, so this script issues both with the
// same app registration (client credentials) and caches them in `state`.
//
// Defender for Endpoint streams use an "mde/" endpoint path, which is rerouted here to the
// Defender for Endpoint host. Paging links that already point at that host get its token too.
//
// The script avoids returning early: it always runs to the end so the platform picks up the
// final url and headers.

const GRAPH_SCOPE = "https://graph.microsoft.com/.default";
const MDE_HOST = "api.securitycenter.microsoft.com";
const MDE_SCOPE = "https://api.securitycenter.microsoft.com/.default";
const MDE_MARKER = "/security/mde/";

const markerIndex = url.pathname.indexOf(MDE_MARKER);
if (markerIndex !== -1) {
    url.hostname = MDE_HOST;
    url.pathname = `/api/${url.pathname.slice(markerIndex + MDE_MARKER.length)}`;
}

const isMde = url.hostname === MDE_HOST;
const scope = isMde ? MDE_SCOPE : GRAPH_SCOPE;
const apiName = isMde ? "Microsoft Defender for Endpoint API" : "Microsoft Graph API";

// --- token -----------------------------------------------------------------------

const tokens = { ...(state?.tokens ?? {}) };
let token = tokens[scope]?.expiryTime > Date.now() ? tokens[scope].token : undefined;

if (typeof token !== "string") {
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
                scope
            }).toString()
        }
    );

    if (response.ok) {
        const payload = await response.json();
        if (typeof payload?.access_token === "string") {
            const lifetimeMs = typeof payload.expires_in === "number" ? payload.expires_in * 1000 : 3600000;
            token = payload.access_token;
            tokens[scope] = {
                token,
                // Refresh 5 minutes early so a long paged request can't expire mid-flight.
                expiryTime: Date.now() + lifetimeMs - Math.min(300000, Math.floor(lifetimeMs / 2))
            };
            state = { ...state, tokens };
        } else {
            api.report.error(`Microsoft Entra ID returned no access token for the ${apiName}.`);
        }
    } else {
        // Entra ID error descriptions end with trace and correlation IDs; keep the first line.
        let detail = "";
        try {
            const error = await response.json();
            detail = String(error?.error_description || error?.error || "").split(/\r?\n/)[0];
        } catch {
            detail = response.statusText;
        }
        const hint = isMde
            ? "Check the app has the WindowsDefenderATP 'Vulnerability.Read.All' application permission with admin consent, and that Defender for Endpoint or Defender for Business is set up in the tenant."
            : "Check the tenant ID, client ID and client secret, and that the secret has not expired.";
        api.report.error(`Could not get a token for the ${apiName} (HTTP ${response.status}). ${hint} ${detail}`.trim());
    }
}

// --- request ---------------------------------------------------------------------

if (typeof token === "string") {
    headers["Authorization"] = `Bearer ${token}`;
}
