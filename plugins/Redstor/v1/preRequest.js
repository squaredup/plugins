// Redstor RedAPI authenticates using OAuth2 client_credentials with the
// `private_key_jwt` client-authentication method (RFC 7523 / OIDC): a JWT
// assertion is signed with a service account's private key and exchanged
// at the token endpoint for a short-lived access token.
//
// Unlike a standard OAuth2 flow, the resulting access token is NOT sent as
// `Authorization: Bearer` on API calls — RedAPI's OpenAPI spec declares the
// security scheme as an `X-Api-Key` header, so that's where the token goes.
//
// The access token is cached in `state` and reused until shortly before
// expiration; the client-assertion JWT itself is re-signed on every
// exchange (it is short-lived by design, not cached).

const TOKEN_ENDPOINT = "https://id.redstor.com/connect/token";

// --- helpers -----------------------------------------------------------------------

function pemToArrayBuffer(pem) {
    const base64 = String(pem)
        .replace(/-----BEGIN [^-]+-----/, "")
        .replace(/-----END [^-]+-----/, "")
        .replace(/\s+/g, "");
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
}

function bytesToBase64Url(bytes) {
    let binary = "";
    for (let i = 0; i < bytes.length; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function utf8ToBytes(str) {
    return new TextEncoder().encode(str);
}

async function signClientAssertion(clientId, privateKeyPem) {
    const header = { alg: "RS256", typ: "JWT" };
    const nowSeconds = Math.floor(Date.now() / 1000);
    const payload = {
        iss: clientId,
        sub: clientId,
        aud: TOKEN_ENDPOINT,
        jti: crypto.randomUUID(),
        iat: nowSeconds,
        // Short-lived on purpose: this JWT authenticates the token-exchange
        // request itself, not subsequent API calls.
        exp: nowSeconds + 300,
    };

    const encodedHeader = bytesToBase64Url(utf8ToBytes(JSON.stringify(header)));
    const encodedPayload = bytesToBase64Url(utf8ToBytes(JSON.stringify(payload)));
    const signingInput = `${encodedHeader}.${encodedPayload}`;

    const key = await crypto.subtle.importKey(
        "pkcs8",
        pemToArrayBuffer(privateKeyPem),
        { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
        false,
        ["sign"],
    );

    const signature = await crypto.subtle.sign(
        "RSASSA-PKCS1-v1_5",
        key,
        utf8ToBytes(signingInput),
    );

    return `${signingInput}.${bytesToBase64Url(new Uint8Array(signature))}`;
}

// --- token -----------------------------------------------------------------------

if (typeof state?.token !== "string" || (state?.expiryTime ?? 0) <= Date.now()) {
    const clientId = String(secrets.clientId || "").trim();
    const privateKey = String(secrets.privateKey || "").trim();

    if (!clientId || !privateKey) {
        api.report.error("Redstor RedAPI Client ID or Private Key is not configured.");
        return;
    }

    let clientAssertion;
    try {
        clientAssertion = await signClientAssertion(clientId, privateKey);
    } catch (e) {
        api.report.error(
            `Could not sign the Redstor client assertion — check the Private Key is a valid PEM-encoded RSA private key. ${e}`,
        );
        return;
    }

    const body = new URLSearchParams({
        grant_type: "client_credentials",
        client_assertion_type: "urn:ietf:params:oauth:client-assertion-type:jwt-bearer",
        client_assertion: clientAssertion,
        scope: "api.read",
    }).toString();

    const response = await fetch(TOKEN_ENDPOINT, {
        method: "post",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body,
    });

    if (!response.ok) {
        if (response.status === 400 || response.status === 401) {
            api.report.error(
                `Redstor rejected the RedAPI service account credentials (HTTP ${response.status}). Check the Client ID and Private Key.`,
            );
        } else {
            api.report.error(
                `Could not obtain a Redstor access token: HTTP ${response.status} ${response.statusText}`,
            );
        }
        return;
    }

    const payload = await response.json();
    const token = payload?.access_token;
    const expiresIn = payload?.expires_in;

    if (!token) {
        api.report.error(
            "Redstor returned a successful token response but no access_token was found.",
        );
        return;
    }

    const lifetimeMs = typeof expiresIn === "number" ? expiresIn * 1000 : 3600000;
    // Refresh 5 minutes before expiration so a long-running request is less
    // likely to fail because the token expires mid-flight.
    const refreshMarginMs = Math.min(300000, Math.floor(lifetimeMs / 2));

    state = {
        ...state,
        token,
        expiryTime: Date.now() + lifetimeMs - refreshMarginMs,
    };
}

// --- request ---------------------------------------------------------------------

headers["X-Api-Key"] = state.token;
