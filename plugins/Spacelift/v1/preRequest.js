// Spacelift's GraphQL API takes a short-lived JWT, which a secret-based API key is
// exchanged for with the apiKeyUser mutation. No authMode covers an exchange made through
// a GraphQL mutation, so it happens here and the token is cached in `state` until shortly
// before the expiry Spacelift returns with it.

// The account URL may be saved with a trailing slash, which doubles the separator before
// the `graphql` endpoint path.
url.pathname = url.pathname.replace(/\/{2,}/g, "/");

const REFRESH_EARLY_MS = 2 * 60 * 1000;
// Used only if a token comes back without validUntil. API key tokens last about an hour.
const FALLBACK_LIFETIME_MS = 50 * 60 * 1000;

if (typeof state?.token !== "string" || (state?.expiryTime ?? 0) <= Date.now()) {
    const response = await fetch(`${url.origin}/graphql`, {
        method: "post",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
            query: "mutation ApiKeyUser($id: ID!, $secret: String!) { apiKeyUser(id: $id, secret: $secret) { jwt validUntil } }",
            variables: {
                id: String(secrets.apiKeyId || "").trim(),
                secret: String(secrets.apiKeySecret || "").trim()
            }
        })
    });

    let payload = null;
    try {
        payload = await response.json();
    } catch {
        payload = null;
    }

    // An unknown or revoked key comes back as HTTP 200 with a GraphQL `errors` array and no user.
    const user = payload?.data?.apiKeyUser;
    if (response.status === 404) {
        api.report.error(
            `No Spacelift API was found at ${url.origin} (HTTP 404). Check the account URL is the address you sign in to Spacelift at.`
        );
        return;
    }
    if (!response.ok || !user?.jwt) {
        const reason =
            (payload?.errors || []).map((e) => e.message).filter(Boolean).join("; ") ||
            `HTTP ${response.status} ${response.statusText}`;
        api.report.error(
            `Spacelift did not accept the API key (${reason}). Check the account URL, the API key ID and secret, ` +
                "and that the key has not expired or been deleted."
        );
        return;
    }

    const expiresAt = typeof user.validUntil === "number" ? user.validUntil * 1000 : Date.now() + FALLBACK_LIFETIME_MS;
    state = { ...state, token: user.jwt, expiryTime: expiresAt - REFRESH_EARLY_MS };
}

headers["Authorization"] = `Bearer ${state.token}`;
