// Fuel Finder's token endpoint is not standard OAuth2: it takes a JSON body
// of snake_case client credentials and nests the token inside a data wrapper,
// so the platform's built-in oauth2 authMode cannot parse it.
// A token is generated fresh for every request rather than cached: generating
// a token revokes previously issued ones, so a cached token dies as soon as
// any other surface (config validation, another request context) authenticates
// with the same credentials.
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
    // throw rather than api.report.error so the request is aborted instead of
    // going out with "Bearer undefined"
    throw new Error(
        `Failed to get Fuel Finder access token: HTTP ${resp.status} - ${JSON.stringify(payload).slice(0, 300)}`,
    );
}
headers["Authorization"] = `Bearer ${tokenData.access_token}`;
