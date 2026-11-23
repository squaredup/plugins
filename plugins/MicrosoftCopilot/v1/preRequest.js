// Copilot data spans several Microsoft APIs, and Entra issues a separate client-credentials
// token for each one's audience. Each stream targets its API's own host, so the host picks
// the audience. Tokens are cached per host in state until a minute before they expire.
const audiences = {
    "graph.microsoft.com": "https://graph.microsoft.com/.default",
    "management.azure.com": "https://management.azure.com/.default",
    "api.powerplatform.com": "https://api.powerplatform.com/.default",
    "api.bap.microsoft.com": "https://service.powerapps.com/.default",
};

const scope = audiences[url.host];
if (!scope) {
    api.report.error(`No token audience is configured for ${url.host}`);
}

const now = Date.now();
const tokens = { ...(state?.tokens ?? {}) };
const cached = tokens[url.host];

if (typeof cached?.token !== "string" || (cached.expiryTime ?? 0) <= now) {
    const form = {
        grant_type: "client_credentials",
        client_id: String(secrets.clientId ?? "").trim(),
        client_secret: String(secrets.clientSecret ?? "").trim(),
        scope,
    };
    const resp = await fetch(
        `https://login.microsoftonline.com/${encodeURIComponent(String(secrets.tenantId ?? "").trim())}/oauth2/v2.0/token`,
        {
            method: "post",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: Object.entries(form)
                .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
                .join("&"),
        },
    );
    const payload = await resp.json().catch(() => ({}));
    if (!resp.ok || typeof payload.access_token !== "string") {
        api.report.error(
            `Failed to get a token for ${scope}: ${resp.status} ${payload.error_description ?? resp.statusText}`,
        );
    }
    tokens[url.host] = {
        token: payload.access_token,
        // Refresh a minute early so a token never expires mid-request
        expiryTime: now + (payload.expires_in ?? 3600) * 1000 - 60000,
    };
    state = { ...(state ?? {}), tokens };
}

headers["Authorization"] = `Bearer ${tokens[url.host].token}`;
