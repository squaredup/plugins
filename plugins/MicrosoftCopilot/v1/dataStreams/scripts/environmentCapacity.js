// The Power Platform API has no call that lists allocations across environments: the tenant
// currency report (the request this stream makes) only carries totals. So each environment in
// scope is fetched here, with the token the pre-request script added to the request.
// Environments that can't hold allocations, such as developer and legacy environments, return
// 404 and are left out, so a tile scoped to many environments still loads in full.
const prop = (v) => (Array.isArray(v) ? v[0] : v);
const LABELS = { MCSMessages: "Copilot Credits" };
const CONCURRENCY = 5;

const environments = (context.objects || [])
    .map((o) => ({ id: prop(o.rawId), name: prop(o.name) }))
    .filter((e) => e.id);

const fetchAllocations = async (env) => {
    let resp;
    try {
        resp = await fetch(
            `https://${url.host}/licensing/environments/${encodeURIComponent(env.id)}/allocations?api-version=2024-10-01`,
            { headers: { Authorization: headers.Authorization, Accept: "application/json" } },
        );
    } catch (err) {
        // A network failure for one environment shouldn't lose the others' rows
        api.report.warning(`Couldn't get allocations for ${env.name}: ${err && err.message ? err.message : err}`);
        return [];
    }
    if (resp.status === 404) {
        return [];
    }
    const body = await resp.json().catch(() => ({}));
    if (!resp.ok) {
        api.report.warning(
            `Couldn't get allocations for ${env.name}: ${resp.status} ${(body.error && body.error.message) || resp.statusText}`,
        );
        return [];
    }
    return (body.currencyAllocations || []).map((a) => ({
        environmentName: env.name,
        environmentId: body.environmentId || env.id,
        currency: LABELS[a.currencyType] || a.currencyType,
        allocated: a.allocated,
        currencyType: a.currencyType,
    }));
};

const rows = [];
for (let i = 0; i < environments.length; i += CONCURRENCY) {
    const batch = await Promise.all(environments.slice(i, i + CONCURRENCY).map(fetchAllocations));
    batch.forEach((r) => rows.push(...r));
}
result = rows;
