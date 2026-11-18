const unwrap = (v) => (Array.isArray(v) ? v[0] : v);
const selected = (name) =>
    new Set(((context.config && context.config[name]) || []).map((o) => unwrap(o.rawId)).filter(Boolean));
const rel = (item, name) => (item.relationships && item.relationships[name] && item.relationships[name].data) || null;
const relAttr = (item, name, attr) => {
    const d = rel(item, name);
    return (d && ((d.attributes && d.attributes[attr]) || d[attr])) || null;
};
const items = Array.isArray(data && data.data) ? data.data : data && data.data ? [data.data] : [];
const tenantFilter = selected("tenant");
// The tenants endpoint has no tenant filter, so apply the data source's tenant scope here.
const ds = (context.dataSources && context.dataSources[0]) || {};
const scope = new Set(
    ds.tenantScope === "selected"
        ? (ds.tenantIds || []).flatMap((o) => String(o.value).split(",").map((id) => id.trim())).filter(Boolean)
        : []
);
const typeFilter = context.config && context.config.tenantType;
// Parents are resolved from this response: a multi-site's own parent is often the Auvik
// root, which the user can't see and which isn't imported.
const names = Object.fromEntries(items.map((t) => [t.id, (t.attributes || {}).displayName || (t.attributes || {}).domainPrefix || t.id]));

result = items
    .filter((t) => !scope.size || scope.has(t.id))
    .filter((t) => !tenantFilter.size || tenantFilter.has(t.id))
    .filter((t) => !typeFilter || (t.attributes && t.attributes.tenantType) === typeFilter)
    .map((t) => {
        const a = t.attributes || {};
        const address = a.address || {};
        const parent = rel(t, "parent");
        // Status is only reported by the detail endpoint (domain prefix configured).
        let status = "Unknown";
        if (a.enabled === false) status = "Disabled";
        else if (a.running === true) status = a.subscribed === false && a.trialEndDate ? "Trial" : "Running";
        else if (a.running === false) status = "Stopped";
        return {
            id: t.id,
            name: a.displayName || a.domainPrefix || t.id,
            domainPrefix: a.domainPrefix || null,
            tenantType: a.tenantType || null,
            parentId: (parent && parent.id) || null,
            parentName: (parent && names[parent.id]) || null,
            status,
            enabled: a.enabled ?? null,
            subscribed: a.subscribed ?? null,
            running: a.running ?? null,
            subscriptionOwner: a.subscriptionOwner || null,
            trialEndDate: a.trialEndDate || null,
            city: address.city || null,
            country: address.country || null,
        };
    });
