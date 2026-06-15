# metadata.json Reference

## Contents

- [metadata.json template and field notes](#metadatajson)
- [Auth patterns](#auth-patterns)

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
