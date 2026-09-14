# metadata.json Reference

## Contents

- [metadata.json template and field notes](#metadatajson)
- [Auth patterns](#auth-patterns)
- [Pre-request scripts (custom auth flows)](#pre-request-scripts-custom-auth-flows)

---

## metadata.json

```json
{
    "name": "my-plugin",
    "displayName": "My Plugin",
    "version": "1.0.0",
    "author": { "name": "@yourhandle", "type": "community" },
    "description": "One sentence, max 300 chars.",
    "category": "Monitoring",
    "type": "hybrid",
    "schemaVersion": "2.1",
    "importNotSupported": false,
    "restrictedToPlatforms": [],
    "keywords": ["keyword1", "keyword2"],
    "objectTypes": ["My Installation", "My Device"],
    "links": [
        {
            "category": "documentation",
            "url": "...",
            "label": "Help adding this plugin"
        },
        { "category": "source", "url": "...", "label": "Repository" }
    ],
    "base": {
        "plugin": "WebAPI",
        "majorVersion": "1",
        "config": {
            "baseUrl": "https://api.example.com/v2",
            "authMode": "none",
            "headers": [
                { "key": "Authorization", "value": "Bearer {{accessToken}}" }
            ],
            "queryArgs": []
        }
    }
}
```

**Field notes:**

- `name`: lowercase kebab-case (e.g. `my-plugin`). Folder uses PascalCase (e.g. `MyPlugin`) — these are separate things.
- `author.type`: `"community"` for external contributors, `"labs"` for SquaredUp Labs plugins.
- `type`: always `"hybrid"` for Web API plugins. Options: `"hybrid"` (cloud or on-prem agent), `"cloud"`, `"onprem"`.
- `schemaVersion`: always `"2.1"`.
- `category`: `"Monitoring"`, `"Database"`, `"Security"`, `"Network"`, `"Infrastructure"`, `"Cloud Platforms"`, `"APM"`, `"CI/CD Tools"`, `"Alert Management"`, `"Issue Tracking"`, `"Collaboration"`, `"Service Management"`, `"Analytics"`, `"CRM"`, `"Version Control"`, `"CDN"`, `"Utility"`, `"Fun"`. New categories can be added if no existing one fits closely enough.
- `links` and `keywords` must be added manually — not populated by the export modal.
- `documentation` link must point to in-repo `docs/README.md` (e.g. `https://github.com/squaredup/plugins/blob/main/plugins/MyPlugin/v1/docs/README.md`). Do not link to the vendor's own docs.

---

## Auth patterns

**API key in header:**

```json
"authMode": "none",
"headers": [{ "key": "X-API-Key", "value": "{{apiKey}}" }]
```

**Bearer token:**

```json
"authMode": "none",
"headers": [{ "key": "Authorization", "value": "Bearer {{accessToken}}" }]
```

**API key as query parameter:**

```json
"authMode": "none",
"queryArgs": [{ "key": "api_key", "value": "{{apiKey}}" }]
```

**Basic auth:**

```json
"authMode": "basic",
"basicAuthUsername": "{{username}}",
"basicAuthPassword": "{{password}}"
```

**Digest auth:**

```json
"authMode": "digest",
"digestAuthUsername": "{{username}}",
"digestAuthPassword": "{{password}}"
```

**OAuth2 client credentials:**

```json
"authMode": "oauth2",
"oauth2GrantType": "clientCredentials",
"oauth2TokenUrl": "https://api.example.com/oauth/token",
"oauth2ClientId": "{{clientId}}",
"oauth2ClientSecret": "{{clientSecret}}"
```

**OAuth2 authorization code** (user signs in via browser — e.g. Google Sheets, Snowflake):

```json
"authMode": "oauth2",
"oauth2GrantType": "authCode",
"oauth2AuthUrl": "https://accounts.example.com/oauth/authorize",
"oauth2TokenUrl": "https://accounts.example.com/oauth/token",
"oauth2ClientId": "{{oauth2ClientId}}",
"oauth2Scope": "read:data offline_access",
"oauth2AuthExtraArgs": [
    { "key": "response_type", "value": "code" },
    { "key": "access_type", "value": "offline" }
]
```

Token refresh is handled automatically for all OAuth2 flows.

**OAuth2 password grant:**

```json
"authMode": "oauth2",
"oauth2GrantType": "password",
"oauth2TokenUrl": "https://api.example.com/oauth/token",
"oauth2ClientId": "{{clientId}}",
"oauth2ClientSecret": "{{clientSecret}}",
"oauth2PasswordGrantUserName": "{{username}}",
"oauth2PasswordGrantPassword": "{{password}}"
```

**Advanced OAuth2 options** (provider-specific edge cases):

```json
"oauth2ClientSecretLocationDuringAuth": "body",    // "query" (default), "body", or "header"
"oauth2SendTokenInParameters": true,               // send access token as query param instead of Bearer header
"oauth2TokenExtraArgs": [{ "key": "k", "value": "v" }],
"oauth2TokenExtraHeaders": [{ "key": "k", "value": "v" }]
```

OAuth URLs and scopes support `{{fieldName}}` expressions — useful when the auth URL includes a tenant ID from the user's config:

```json
"oauth2AuthUrl": "https://{{accountId}}.example.com/oauth/authorize",
"oauth2Scope": "read {{role ? 'role:' + role : ''}}"
```

**JWT Bearer** (HMAC — `HS256`/`HS384`/`HS512`; distinct from the static "Bearer token" pattern above — this signs a fresh JWT and attaches it to every request):

```json
"authMode": "jwtBearer",
"jwtAlgorithm": "HS256",
"jwtSecret": "{{jwtSecret}}",
"jwtPayload": {
    "iss": "my-integration",
    "sub": "{{accountId}}",
    "iat": "{{Math.floor(Date.now() / 1000) - 60}}",
    "exp": "{{Math.floor(Date.now() / 1000) + 600}}"
}
```

**JWT Bearer** (asymmetric — `RS256`/`RS384`/`RS512`, `PS256`/`PS384`/`PS512`, `ES256`/`ES384`/`ES512`):

```json
"authMode": "jwtBearer",
"jwtAlgorithm": "RS256",
"jwtPrivateKey": "{{jwtPrivateKey}}",
"jwtPayload": {
    "iss": "my-integration",
    "iat": "{{Math.floor(Date.now() / 1000) - 60}}",
    "exp": "{{Math.floor(Date.now() / 1000) + 600}}"
}
```

Set exactly one of `jwtSecret` (HMAC algorithms) or `jwtPrivateKey` — a PEM-encoded private key — for every other algorithm; never both. There's no caching/refresh step to configure — unlike OAuth2, a fresh JWT is signed on every request.

**Advanced JWT options:**

```json
"jwtTokenLocation": "queryParam",     // "header" (default) or "queryParam"
// Prefer "header"; query params can leak the token via logs/referrers.
"jwtQueryParamName": "token",         // required when jwtTokenLocation is "queryParam" — the query param the JWT is sent as
"jwtSecretIsBase64": true,            // set when jwtSecret is base64-encoded rather than plain text
"jwtHeaderPrefix": "Bearer ",         // text prepended to the token when sent as a header; defaults to "Bearer " (include the trailing space if overriding)
"jwtHeaders": { "kid": "my-key-id" }  // extra claims merged into the JWT's own header (not the HTTP request header), e.g. a key ID
```

`jwtPayload` and `jwtHeaders` are plain JSON objects; any string value can itself be a `{{ ... }}` expression, evaluated fresh on every request — this is how `iat`/`exp` stay current without any extra logic.

---

## Pre-request scripts (custom auth flows)

Some APIs have an auth flow no `authMode` above can express — exchanging a long-lived credential for a short-lived access token via an auth endpoint, or signing each request (HMAC canonical-request signatures). For these, set a **pre-request script** in `base.config`: JavaScript that runs immediately before **every** HTTP request the plugin makes (all data streams, including import streams) and can rewrite the request's `url`, `headers`, and `body`.

Exhaust the auth patterns above first — a pre-request script that only sets a static header is just a `headers` entry, and token refresh for OAuth2/JWT Bearer is already automatic.

### Wiring

In `base.config`:

```json
"showScripting": true,
"scriptingVariables": [
    { "key": "signedJwt", "value": "{{signedJwt}}" }
],
"preRequestScript": "preRequest.js"
```

- `showScripting` — **required whenever `preRequestScript` is set.** It defaults to `false`, and when it's falsy the platform skips the pre-request script entirely: no error, no warning, and the `Headers` diagnostic just shows the static `headers` from `base.config`. The symptom is a plugin that looks correctly wired but sends unauthenticated requests. In the manual WebAPI data source this is the "Pre-request script" toggle a user ticks; a declarative plugin has no one to tick it, so it must set the flag itself.
- `scriptingVariables` — key/value secrets the script reads as `secrets.<key>`. Values support `{{fieldName}}` expressions referencing `ui.json` fields, same as `headers`. Values are encrypted at rest.
- `preRequestScript` — a file reference relative to the plugin's version root (unlike data-stream scripts, which live under `dataStreams/scripts/`): put the script at `<plugin>/v1/preRequest.js`; it's inlined into the config at deploy time. There's only ever one per plugin, so it doesn't need a per-plugin filename or subfolder.
- `scriptState` — never set this: it's a reserved config property where the platform persists the script's `state`, encrypted.

### Script scope

The script body runs inside an async function — top-level `await` works. `fetch` and `crypto.subtle` are available (for auth calls and HMAC/SHA signing).

| Variable  | Mutable | Notes                                                                                                                                                                                  |
| --------- | ------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `url`     | Yes     | [`URL`](https://developer.mozilla.org/en-US/docs/Web/API/URL) instance of the full endpoint address about to be called                                                                 |
| `method`  | No      | `"get"` or `"post"`                                                                                                                                                                    |
| `headers` | Yes     | POJO of request headers — the usual thing a script mutates                                                                                                                             |
| `body`    | Yes     | Request body (POST only)                                                                                                                                                               |
| `state`   | Yes     | POJO persisted (encrypted) between requests — cache tokens here with an expiry. It can disappear at any time, so always re-derive when missing or expired, never assume it's populated |
| `secrets` | No      | Values from `scriptingVariables`, by key                                                                                                                                               |
| `api`     | No      | `api.report.warning(text)` / `api.report.error(text)`                                                                                                                                  |
| `context` | No      | `dataSources[0]` (the plugin config, incl. `baseUrl`), `objects`, `timeframe`, `config` (the calling stream's config), `pagingContext`                                                 |

### Example: token exchange with cached state

The user supplies a pre-signed JWT (a `ui.json` field mapped via `scriptingVariables`); the script exchanges it for a short-lived access token and caches it in `state` until expiry:

```javascript
// preRequest.js
const now = Date.now();
if (typeof state?.token !== "string" || (state?.expiryTime ?? 0) <= now) {
    const authUrl = `${context.dataSources[0].baseUrl.replace(/\/*$/, "")}/api/auth/authenticate`;
    const resp = await fetch(authUrl, {
        method: "post",
        headers: {
            Accept: "application/json",
            Authorization: `Bearer ${secrets.signedJwt}`,
        },
    });
    if (!resp.ok) {
        api.report.error(
            `Failed to get token: ${resp.status} - ${resp.statusText}`,
        );
    }
    const payload = await resp.json();
    state = {
        token: payload.tokens.access.token,
        // refresh 1 minute early to be safe
        expiryTime: now + payload.tokens.access.expirySeconds * 1000 - 60000,
    };
}
headers["Authorization"] = `Bearer ${state.token}`;
```
