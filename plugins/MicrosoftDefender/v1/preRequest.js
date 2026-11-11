// Most streams call Microsoft Graph with the token from the built-in OAuth2 settings. Vulnerability
// data without advanced hunting comes from the Microsoft Defender for Endpoint API instead, which
// needs a token for a different audience. This script handles only those requests: streams mark
// them with an "mde/" endpoint path, which is rerouted here to the Defender for Endpoint host, and
// the Graph token is replaced with a Defender for Endpoint token from the same app registration.
// Paging links that already point at that host get the same token. Every other request is left
// untouched, so Graph keeps working even if this script fails.
//
// The script avoids returning early: it always runs to the end so the platform picks up the
// final url and headers.

// login.microsoftonline.com is listed in allowedScriptHosts in metadata.json. The Defender for
// Endpoint host shares the microsoft.com domain with the Graph base URL, so it needs no listing.
const TOKEN_HOST = "login.microsoftonline.com";
const MDE_HOST = "api.securitycenter.microsoft.com";
const MDE_SCOPE = "https://api.securitycenter.microsoft.com/.default";
const MDE_MARKER = "/security/mde/";

const markerIndex = url.pathname.indexOf(MDE_MARKER);
if (markerIndex !== -1) {
    url.hostname = MDE_HOST;
    url.pathname = `/api/${url.pathname.slice(markerIndex + MDE_MARKER.length)}`;
}

if (url.hostname === MDE_HOST) {
    let token = state?.mdeToken?.expiryTime > Date.now() ? state.mdeToken.token : undefined;

    if (typeof token !== "string") {
        const tenantId = String(secrets.tenantId || "").trim();

        const response = await fetch(
            `https://${TOKEN_HOST}/${encodeURIComponent(tenantId)}/oauth2/v2.0/token`,
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

        if (response.ok) {
            const payload = await response.json();
            if (typeof payload?.access_token === "string") {
                const lifetimeMs = typeof payload.expires_in === "number" ? payload.expires_in * 1000 : 3600000;
                token = payload.access_token;
                state = {
                    ...state,
                    mdeToken: {
                        token,
                        // Refresh 5 minutes early so a long paged request can't expire mid-flight.
                        expiryTime: Date.now() + lifetimeMs - Math.min(300000, Math.floor(lifetimeMs / 2))
                    }
                };
            } else {
                api.report.error("Microsoft Entra ID returned no access token for the Microsoft Defender for Endpoint API.");
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
            api.report.error(
                `Could not get a token for the Microsoft Defender for Endpoint API (HTTP ${response.status}). ` +
                    "Check the tenant ID, client ID and client secret, and that the app has the WindowsDefenderATP " +
                    "'Vulnerability.Read.All' application permission with admin consent. " +
                    detail
            );
        }
    }

    // Always replace the Graph token: sending it to another API would fail anyway, and the
    // Defender for Endpoint API should never receive a token meant for Graph.
    if (typeof token === "string") {
        headers["Authorization"] = `Bearer ${token}`;
    } else {
        delete headers["Authorization"];
    }
}
