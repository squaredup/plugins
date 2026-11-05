// TeamDynamix authenticates with a JWT obtained by POSTing a BEID / Web Services Key
// pair to /api/auth/loginadmin. No built-in authMode covers that exchange, so it happens
// here and the resulting token is cached in `state`.
//
// This script also normalises the request path: the user pastes a full Web API address,
// which may or may not have a trailing slash, so collapse any doubled separator before
// sending.
//
// Rate limiting itself is left to the platform rather than paced here. TeamDynamix returns
// proper X-RateLimit-* headers, and the errorHandling script on every stream (rateLimit.js)
// already turns a 429 into a clear, self-healing message naming when it resets. An earlier
// version of this script also held a minimum gap between consecutive requests via `state`,
// but that read-then-write isn't atomic across genuinely concurrent invocations — several
// tiles refreshing at once, or the platform fanning out one call per matched object — so it
// couldn't reliably prevent the bursts it was meant to smooth out, and was removed.

url.pathname = url.pathname.replace(/\/{2,}/g, "/");

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// The rate-limiting guide asks clients to wait until X-RateLimit-Reset and to enforce a
// 5 second floor on top, to absorb clock skew and time-zone differences.
const RATE_LIMIT_FLOOR_MS = 5000;
const MAX_AUTH_RETRY_WAIT_MS = 10000;

// --- token -----------------------------------------------------------------------

// Read the lifetime out of the JWT's own `exp` claim rather than assuming the documented
// 24 hours: an instance configured with a shorter lifetime then still refreshes in time.
// Returns 0 if the token can't be decoded, which falls back to a conservative 12 hours.
const expiryFromJwt = (token) => {
    try {
        const segment = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
        const payload = JSON.parse(atob(segment));
        return typeof payload.exp === "number" ? payload.exp * 1000 : 0;
    } catch {
        return 0;
    }
};

if (typeof state?.token !== "string" || (state?.expiryTime ?? 0) <= Date.now()) {
    const authUrl = `${String(secrets.apiBaseUrl || "")
        .trim()
        .replace(/\/+$/, "")}/api/auth/loginadmin`;

    const request = {
        method: "post",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
            BEID: String(secrets.beid || "").trim(),
            WebServicesKey: String(secrets.webServicesKey || "").trim()
        })
    };

    let response = await fetch(authUrl, request);

    // The auth endpoint is itself rate limited, per IP address, and the limit is set per
    // tenant (one real tenant allows 30 requests a period, not the documented 60). Retry once
    // only if the limit resets soon: a tile gives up after about 30 seconds, so waiting out a
    // full period just turns a clear rate-limit error into "Data source timed out".
    if (response.status === 429) {
        const resetHeader = response.headers.get("X-RateLimit-Reset") || "";
        const resetAt = Date.parse(resetHeader);
        const waitMs = Number.isNaN(resetAt)
            ? RATE_LIMIT_FLOOR_MS
            : Math.max(RATE_LIMIT_FLOOR_MS, resetAt - Date.now() + RATE_LIMIT_FLOOR_MS);
        if (waitMs > MAX_AUTH_RETRY_WAIT_MS) {
            api.report.error(
                "TeamDynamix rate limit reached while signing in" +
                    (resetHeader ? ` (resets at ${resetHeader})` : "") +
                    ". This will load again after that. If this happens often, reduce the number " +
                    "of TeamDynamix tiles refreshing at once."
            );
            return;
        }
        await sleep(waitMs);
        response = await fetch(authUrl, request);
    }

    if (!response.ok) {
        if (response.status === 400 || response.status === 401 || response.status === 403) {
            api.report.error(
                `TeamDynamix rejected the BEID and Web Services Key (HTTP ${response.status}). ` +
                    "Check both values on the organization detail page in TDAdmin, and that the " +
                    "admin service account is set to Active."
            );
        } else if (response.status === 404) {
            api.report.error(
                `No TeamDynamix Web API found at ${authUrl} (HTTP 404). Check the Web API address ` +
                    "ends in /TDWebApi (or /SBTDWebApi for a sandbox)."
            );
        } else {
            api.report.error(
                `Could not obtain a TeamDynamix token: HTTP ${response.status} ${response.statusText}`
            );
        }
        return;
    }

    // loginadmin returns the bare token rather than an object wrapping it. Instances have
    // been seen to send it both as a JSON-quoted string and as raw text, so read it as
    // text and strip any surrounding quotes instead of assuming a JSON body.
    const token = (await response.text()).trim().replace(/^"|"$/g, "");
    if (!token) {
        api.report.error("TeamDynamix returned an empty authentication token.");
        return;
    }

    const expiresAt = expiryFromJwt(token);
    state = {
        ...state,
        token,
        // Refresh 5 minutes early so a long-running import can't expire mid-flight.
        expiryTime: expiresAt ? expiresAt - 300000 : Date.now() + 12 * 60 * 60 * 1000
    };
}

headers["Authorization"] = `Bearer ${state.token}`;

// --- standalone configuration items --------------------------------------------
//
// TeamDynamix creates a configuration item for every asset, and the CMDB search has no way to
// exclude them, so an application with 49,000 assets returns 49,000 copies before the first
// standalone item. The search does take TypeIDs, and asset copies always have the system
// "Asset" type (ID 1), so a CMDB search that sets ExcludeAssetCopies is rewritten to ask for
// every other type instead. That needs the application's type list, which is a second request,
// so it is cached per application.
const CMDB_SEARCH_PATH = /\/api\/(\d+)\/cmdb\/search(\/paged)?\/?$/i;
const ASSET_CI_TYPE_ID = 1;
const CI_TYPES_CACHE_MS = 60 * 60 * 1000;

const cmdbSearch = String(method).toLowerCase() === "post" ? url.pathname.match(CMDB_SEARCH_PATH) : null;
if (cmdbSearch) {
    const bodyIsString = typeof body === "string";
    let search = null;
    try {
        search = bodyIsString ? JSON.parse(body) : body;
    } catch {
        search = null;
    }

    if (search && typeof search === "object" && "ExcludeAssetCopies" in search) {
        const exclude = search.ExcludeAssetCopies === true || search.ExcludeAssetCopies === "true";
        delete search.ExcludeAssetCopies;

        if (exclude) {
            const appId = cmdbSearch[1];
            const cached = state?.ciTypes?.[appId];
            let typeIds = cached && cached.expiryTime > Date.now() ? cached.typeIds : null;

            if (!typeIds) {
                const typesUrl = new URL(url.href);
                typesUrl.pathname = typesUrl.pathname.replace(CMDB_SEARCH_PATH, `/api/${appId}/cmdb/types/search`);
                // An empty search returns inactive types too: an active item can still have a
                // type that has since been retired.
                const response = await fetch(typesUrl.href, {
                    method: "post",
                    headers: {
                        "Content-Type": "application/json",
                        Accept: "application/json",
                        Authorization: `Bearer ${state.token}`
                    },
                    body: "{}"
                });
                if (response.ok) {
                    const types = await response.json();
                    typeIds = (Array.isArray(types) ? types : [])
                        .map((type) => type.ID)
                        .filter((id) => typeof id === "number" && id !== ASSET_CI_TYPE_ID);
                    state = {
                        ...state,
                        ciTypes: {
                            ...(state?.ciTypes || {}),
                            [appId]: { typeIds, expiryTime: Date.now() + CI_TYPES_CACHE_MS }
                        }
                    };
                }
            }

            // Without the type list the search runs unfiltered, and configurationItems.js still
            // drops asset copies from what comes back. An application whose only type is
            // "Asset" gets an ID no type has: an empty TypeIDs list means "any type".
            if (typeIds) {
                search.TypeIDs = typeIds.length ? typeIds : [-1];
            }
        }

        body = bodyIsString ? JSON.stringify(search) : search;
    }
}

// --- team tickets --------------------------------------------------------------
//
// A ticket search belongs to one ticketing application, but the Team Tickets stream is scoped to
// groups, which TeamDynamix doesn't tie to a single application. So that stream posts to a
// placeholder path, and this swaps in the ticketing application the selected groups work in.
// Searching every application instead would cost one search each against a rate limit shared
// by the whole organization. Groups from a different application than most of the selection
// match nothing in this search.
const TEAM_TICKETS_PATH = /\/api\/team\/tickets\/search\/?$/i;
const GROUP_APPS_CACHE_MS = 60 * 60 * 1000;

if (String(method).toLowerCase() === "post" && TEAM_TICKETS_PATH.test(url.pathname)) {
    const bodyIsString = typeof body === "string";
    let search = null;
    try {
        search = bodyIsString ? JSON.parse(body) : body;
    } catch {
        search = null;
    }
    const groupIds = [].concat(search?.PrimaryResponsibilityGroupIDs || []).filter((id) => Number(id) > 0);

    // A failed lookup must not be mistaken for "no ticketing application": that path searches
    // an arbitrary application and the tiles show no data, as if the team had no tickets.
    const lookupError = (response) => {
        const resetAt = response.headers.get("X-RateLimit-Reset");
        return response.status === 429
            ? "TeamDynamix rate limit reached while finding the team's ticketing application" +
                  (resetAt ? ` (resets at ${resetAt})` : "") +
                  ". This will load again after that."
            : `TeamDynamix couldn't look up the team's ticketing application (HTTP ${response.status}).`;
    };
    let failedLookup = null;

    // Votes per application, so a mixed selection searches where most of the groups work. A tie
    // goes to the lowest ID, so the choice is stable between refreshes.
    const votes = {};
    for (const groupId of groupIds) {
        const cached = state?.groupApps?.[groupId];
        let appIds = cached && cached.expiryTime > Date.now() ? cached.appIds : null;

        if (!appIds) {
            const appsUrl = new URL(url.href);
            appsUrl.pathname = appsUrl.pathname.replace(TEAM_TICKETS_PATH, `/api/groups/${groupId}/applications`);
            const response = await fetch(appsUrl.href, {
                headers: { Accept: "application/json", Authorization: `Bearer ${state.token}` }
            });
            if (response.ok) {
                const apps = await response.json();
                appIds = (Array.isArray(apps) ? apps : [])
                    .filter((app) => app.AppClass === "TDTickets")
                    .map((app) => app.AppID);
                state = {
                    ...state,
                    groupApps: {
                        ...(state?.groupApps || {}),
                        [groupId]: { appIds, expiryTime: Date.now() + GROUP_APPS_CACHE_MS }
                    }
                };
            } else {
                failedLookup = failedLookup || response;
            }
        }

        for (const appId of appIds || []) {
            votes[appId] = (votes[appId] || 0) + 1;
        }
    }

    let appId = Object.keys(votes)
        .map(Number)
        .sort((a, b) => votes[b] - votes[a] || a - b)[0];

    // Some lookups can fail and still leave an answer from the rest, which is searched.
    if (!appId && failedLookup) {
        api.report.error(lookupError(failedLookup));
        return;
    }

    // A group with no ticketing application, such as a managers' group, can't have tickets
    // assigned to it. Raising an error for that shows every tile on the Team Performance
    // dashboard as "Script error", so search any ticketing application instead: the group
    // filter matches nothing and the tiles show no data, which is the true answer.
    if (!appId && groupIds.length) {
        let ticketAppIds = state?.ticketApps?.expiryTime > Date.now() ? state.ticketApps.appIds : null;
        if (!ticketAppIds) {
            const appsUrl = new URL(url.href);
            appsUrl.pathname = appsUrl.pathname.replace(TEAM_TICKETS_PATH, "/api/applications");
            const response = await fetch(appsUrl.href, {
                headers: { Accept: "application/json", Authorization: `Bearer ${state.token}` }
            });
            if (response.ok) {
                const apps = await response.json();
                ticketAppIds = (Array.isArray(apps) ? apps : [])
                    .filter((app) => app.AppClass === "TDTickets" && app.Active !== false)
                    .map((app) => app.AppID)
                    .sort((a, b) => a - b);
                state = { ...state, ticketApps: { appIds: ticketAppIds, expiryTime: Date.now() + GROUP_APPS_CACHE_MS } };
            } else {
                api.report.error(lookupError(response));
                return;
            }
        }
        appId = ticketAppIds?.[0];
    }

    if (!appId) {
        api.report.error(
            groupIds.length
                ? "No TeamDynamix ticketing application is visible to the admin service account."
                : "Select one or more TeamDynamix groups."
        );
        return;
    }

    url.pathname = url.pathname.replace(TEAM_TICKETS_PATH, `/api/${appId}/tickets/search`);
}
