// Fuel Finder's token endpoint is not standard OAuth2: it takes a JSON body
// of snake_case client credentials and nests the token inside a data wrapper,
// so the platform's built-in oauth2 authMode cannot parse it.
const now = Date.now();
if (typeof state?.token !== "string" || (state?.expiryTime ?? 0) <= now) {
    const baseUrl = context.dataSources[0].baseUrl.replace(/\/*$/, "");
    const resp = await fetch(`${baseUrl}/api/v1/oauth/generate_access_token`, {
        method: "post",
        headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            client_id: secrets.clientId,
            client_secret: secrets.clientSecret,
        }),
    });
    let payload = {};
    try {
        payload = await resp.json();
    } catch (e) {
        // non-JSON body (e.g. an edge error page); fall through to the error below
    }
    // Token may arrive wrapped ({ success, data: { access_token } }) or bare
    const tokenData = payload?.data?.access_token ? payload.data : payload;
    if (!resp.ok || typeof tokenData?.access_token !== "string") {
        api.report.error(
            `Failed to get Fuel Finder access token: HTTP ${resp.status}${payload?.message ? ` - ${payload.message}` : ""}`,
        );
    }
    state = {
        token: tokenData.access_token,
        // refresh 1 minute before the token's expiry (default 1 hour)
        expiryTime: now + (tokenData.expires_in ?? 3600) * 1000 - 60000,
    };
}
headers["Authorization"] = `Bearer ${state.token}`;
