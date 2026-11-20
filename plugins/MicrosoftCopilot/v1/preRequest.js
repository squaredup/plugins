// Copilot data spans several Microsoft APIs, each needing a token for its own
// audience. A pre-request script may only fetch within the base URL's domain,
// so the base URL is the Entra token endpoint's host. Each stream's path then
// starts with an alias for the API it targets (graph/, arm/, powerplatform/,
// bap/),
// which is swapped for that API's real host here. Paging links already carry
// the real host, so they pass straight through.
const hosts = {
    graph: "graph.microsoft.com",
    arm: "management.azure.com",
    powerplatform: "api.powerplatform.com",
    bap: "api.bap.microsoft.com",
};
const audiences = {
    "graph.microsoft.com": "https://graph.microsoft.com/.default",
    "management.azure.com": "https://management.azure.com/.default",
    "api.powerplatform.com": "https://api.powerplatform.com/.default",
    "api.bap.microsoft.com": "https://service.powerapps.com/.default",
};

if (url.host === "login.microsoftonline.com") {
    const [, alias, ...rest] = url.pathname.split("/");
    if (!hosts[alias]) {
        api.report.error(`Unknown API alias "${alias}" in ${url.pathname}`);
    }
    url.host = hosts[alias];
    url.pathname = `/${rest.join("/")}`;
}

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
