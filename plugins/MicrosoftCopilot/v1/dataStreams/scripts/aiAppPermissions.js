// What AI apps have been allowed to do with Microsoft 365 data. The first request, the
// application sign-in summary for the last 30 days, finds the AI apps people use (by name, as in
// AI App Sign-ins). For each, its service principal (Application.Read.All) gives the publisher
// and the application permissions it holds, and its delegated permission grants
// (DelegatedPermissionGrant.Read.All) show whether it was consented for everyone or by
// individual users (User.Read.All resolves who). One row per grant.

// The same vendor table and matching as appSignIns.js, so both streams name the same apps.
// Keep the two in step.
const VENDORS = [
    ["GitHub Copilot", { text: ["github copilot"] }],
    ["Microsoft Copilot", { text: ["copilot", "power virtual agents"] }],
    ["Anthropic", { text: ["claude", "anthropic"] }],
    ["OpenAI", { text: ["openai", "chatgpt", "codex"], words: ["gpt"] }],
    ["Google", { text: ["gemini", "notebooklm"], words: ["bard"] }],
    ["Perplexity", { text: ["perplexity"] }],
    ["Mistral", { text: ["mistral"] }],
    ["xAI", { words: ["grok", "xai"] }],
    ["DeepSeek", { text: ["deepseek"] }],
    ["Cursor", { words: ["cursor"] }],
    ["Glean", { words: ["glean"] }],
    ["Other AI", { words: ["ai", "llm"], suffix: [".ai"] }],
];
const vendorOf = (name) => {
    const lower = name.toLowerCase();
    const words = lower.split(/[^a-z0-9]+/).filter(Boolean);
    const dotted = lower.split(/[^a-z0-9.]+/).filter(Boolean);
    const hit = VENDORS.find(
        ([, m]) =>
            (m.text || []).some((t) => lower.includes(t)) ||
            (m.words || []).some((w) => words.includes(w)) ||
            (m.suffix || []).some((x) => dotted.some((d) => d.endsWith(x))),
    );
    return hit ? hit[0] : null;
};

// Scopes that only identify the user. Anything else is access beyond sign-in, to Microsoft Graph
// or whichever API the grant is on (the resource column says which).
const SIGN_IN_ONLY = ["openid", "profile", "email", "offline_access", "user.read"];
// Apps, and user lookups, are worked through a few at a time: one at a time is too slow for the
// platform's request timeout in a tenant with many AI apps, and all at once invites throttling.
const CONCURRENCY = 5;
const describe = (err) => (err && err.message ? err.message : String(err));
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const inBatches = async (items, fn) => {
    const out = [];
    for (let i = 0; i < items.length; i += CONCURRENCY) {
        out.push(...(await Promise.all(items.slice(i, i + CONCURRENCY).map(fn))));
    }
    return out;
};

// A throttled request (429) is retried after the Retry-After Graph gives. A wait longer than the
// script can afford isn't shortened (that would only be throttled again): the request is given up
// and the result reported as incomplete.
const MAX_WAIT_MS = 10000;
const get = async (path) => {
    const link = path.startsWith("https://") ? path : `https://${url.host}${path}`;
    for (let attempt = 1; ; attempt++) {
        let resp;
        try {
            resp = await fetch(link, {
                headers: { Authorization: headers.Authorization, Accept: "application/json" },
            });
        } catch (err) {
            return { ok: false, status: 0, body: { error: { message: describe(err) } } };
        }
        const waitMs = Number(resp.headers.get("Retry-After") || 1) * 1000;
        if (resp.status === 429 && attempt < 3 && waitMs <= MAX_WAIT_MS) {
            await sleep(waitMs);
            continue;
        }
        return { ok: resp.ok, status: resp.status, body: await resp.json().catch(() => ({})) };
    }
};
// Follows @odata.nextLink to the end. Pages read before a failure are kept, and the failure
// is returned so the result can be reported as incomplete.
const getAll = async (path) => {
    const items = [];
    let next = path;
    while (next) {
        const r = await get(next);
        if (!r.ok) {
            return { items, failure: r };
        }
        items.push(...(r.body.value || []));
        next = r.body["@odata.nextLink"];
    }
    return { items, failure: null };
};
const problems = new Set();
const note = (what, r) =>
    problems.add(`${what}: ${(r.body.error && r.body.error.message) || "HTTP " + r.status}`);

// The APIs that permissions are granted on (Microsoft Graph, or an MCP server), by ID. The
// lookup itself is cached, so apps granted on the same API at the same time share one request.
const resources = new Map();
const resourceOf = (resourceId) => {
    if (!resources.has(resourceId)) {
        resources.set(
            resourceId,
            get(`/v1.0/servicePrincipals/${resourceId}?$select=displayName,appRoles`).then((r) => {
                if (!r.ok) {
                    // The grant is still listed; only its API name and role names are missing
                    note("Couldn't read some APIs that permissions are granted on", r);
                }
                return {
                    name: (r.ok && r.body.displayName) || null,
                    roles: new Map(((r.ok && r.body.appRoles) || []).map((x) => [x.id, x.value])),
                };
            }),
        );
    }
    return resources.get(resourceId);
};

const grantsFor = async (app) => {
    const spResp = await get(
        `/v1.0/servicePrincipals?$filter=appId eq '${app.appId}'&$select=id,displayName,publisherName,verifiedPublisher`,
    );
    if (!spResp.ok) {
        note("Couldn't read AI app details", spResp);
        return [];
    }
    const sp = (spResp.body.value || [])[0];
    if (!sp) {
        return [];
    }
    const base = {
        appDisplayName: sp.displayName || app.name,
        aiVendor: vendorOf(sp.displayName || app.name),
        publisher: (sp.verifiedPublisher && sp.verifiedPublisher.displayName) || sp.publisherName || null,
        verifiedPublisher: !!(sp.verifiedPublisher && sp.verifiedPublisher.displayName),
        appId: app.appId,
    };

    const [grants, roles] = await Promise.all([
        getAll(`/v1.0/oauth2PermissionGrants?$filter=clientId eq '${sp.id}'`),
        getAll(`/v1.0/servicePrincipals/${sp.id}/appRoleAssignments`),
    ]);
    if (grants.failure) {
        note("Couldn't read all delegated permission grants", grants.failure);
    }
    if (roles.failure) {
        note("Couldn't read all application permissions", roles.failure);
    }

    const delegated = await Promise.all(
        grants.items.map(async (g) => {
            const scopes = String(g.scope || "").split(" ").filter(Boolean);
            return {
                ...base,
                resource: (await resourceOf(g.resourceId)).name,
                permissionType: "Delegated",
                grantedTo: g.consentType === "AllPrincipals" ? "All users" : "One user",
                principalId: g.principalId || null,
                permissions: scopes,
                beyondSignIn: scopes.some((s) => !SIGN_IN_ONLY.includes(s.toLowerCase())),
            };
        }),
    );

    // Application permissions, one row per API they're granted on
    const byResource = new Map();
    for (const a of roles.items) {
        const name = (await resourceOf(a.resourceId)).roles.get(a.appRoleId) || a.appRoleId;
        const entry = byResource.get(a.resourceId) || { resource: a.resourceDisplayName, roles: [] };
        entry.roles.push(name);
        byResource.set(a.resourceId, entry);
    }
    const application = [...byResource.values()].map(({ resource, roles: names }) => ({
        ...base,
        resource,
        permissionType: "Application",
        grantedTo: "The app itself",
        principalId: null,
        permissions: names,
        beyondSignIn: names.length > 0,
    }));

    return [...delegated, ...application];
};

const aiApps = (data.value || [])
    .map((a) => ({ appId: a.id, name: String(a.appDisplayName || "") }))
    .filter((a) => a.appId && vendorOf(a.name));
const rows = (await inBatches(aiApps, grantsFor)).flat();

// Users who consented for themselves, by name, looked up 15 at a time (the most an `in` filter
// on users takes)
const ids = [...new Set(rows.map((r) => r.principalId).filter(Boolean))];
const chunks = [];
for (let i = 0; i < ids.length; i += 15) {
    chunks.push(ids.slice(i, i + 15));
}
const users = new Map();
await inBatches(chunks, async (chunk) => {
    const list = chunk.map((id) => `'${id}'`).join(",");
    const r = await get(
        `/v1.0/users?$filter=${encodeURIComponent(`id in (${list})`)}&$select=id,displayName,userPrincipalName&$top=15`,
    );
    if (!r.ok) {
        note("Couldn't look up users", r);
        return;
    }
    for (const u of r.body.value || []) {
        users.set(u.id, u);
    }
});
for (const msg of problems) {
    api.report.warning(msg);
}

result = rows.map((r) => {
    const u = r.principalId ? users.get(r.principalId) : null;
    return {
        ...r,
        userDisplayName: u ? u.displayName : null,
        userPrincipalName: u ? u.userPrincipalName : null,
    };
});
