// preRequest.js
//
// Device Details/Categories need the organization's UUID as a path segment,
// but the user only supplies the numeric Organization ID ("o") - Automox has
// no endpoint that maps one to the other directly from data already in this
// plugin. Resolve it once via GET /orgs and cache it in `state` (persisted,
// encrypted, between requests) so it isn't re-fetched on every request.
//
// Runs before every HTTP call this plugin makes; it's a no-op unless the
// current request's path still carries the placeholder below.
const ORG_UUID_PLACEHOLDER = "__ORG_UUID__";

if (url.pathname.includes(ORG_UUID_PLACEHOLDER)) {
    const configuredOrgId = String(context.dataSources[0].organizationId);

    if (!state || state.orgId !== configuredOrgId || !state.orgUuid) {
        const orgsUrl = new URL("orgs", context.dataSources[0].baseUrl.replace(/\/*$/, "/"));
        orgsUrl.searchParams.set("limit", "250");

        const resp = await fetch(orgsUrl.toString(), {
            headers: { Authorization: headers["Authorization"] },
        });

        if (!resp.ok) {
            api.report.error(`Failed to resolve the organization UUID: GET /orgs returned HTTP ${resp.status}.`);
        } else {
            const orgs = await resp.json();
            const match = (orgs || []).find((o) => String(o.id) === configuredOrgId);

            if (!match) {
                api.report.error(
                    `Organization ID ${configuredOrgId} was not found via GET /orgs - check the Organization ID field.`,
                );
            } else {
                state = { orgId: configuredOrgId, orgUuid: match.uuid };
            }
        }
    }

    if (state && state.orgUuid) {
        url.pathname = url.pathname.replace(ORG_UUID_PLACEHOLDER, state.orgUuid);
    }
}
