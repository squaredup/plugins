// Fuel Finder's token endpoint is not standard OAuth2: it takes a JSON body
// of snake_case client credentials and nests the token inside a data wrapper,
// so the platform's built-in oauth2 authMode cannot parse it.
// Generating a token revokes previously issued ones, so these credentials
// must not be shared with any other data source or application - a cached
// token dies the moment anything else authenticates with them. The token is
// cached in state and only re-minted near expiry, so concurrent requests
// (dashboard tiles refreshing together) reuse one token instead of racing to
// mint and revoking each other's.
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
        // throw rather than api.report.error so the request is aborted instead
        // of going out with "Bearer undefined"
        throw new Error(
            `Failed to get Fuel Finder access token: HTTP ${resp.status} - ${JSON.stringify(payload).slice(0, 300)}`,
        );
    }
    state = {
        token: tokenData.access_token,
        // re-mint a minute before expiry (tokens last an hour)
        expiryTime: now + (tokenData.expires_in ?? 3600) * 1000 - 60000,
    };
}
headers["Authorization"] = `Bearer ${state.token}`;
