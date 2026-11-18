const unwrap = (v) => (Array.isArray(v) ? v[0] : v);
const selected = (name) =>
    new Set(((context.config && context.config[name]) || []).map((o) => unwrap(o.rawId)).filter(Boolean));
const rel = (item, name) => (item.relationships && item.relationships[name] && item.relationships[name].data) || null;
const relAttr = (item, name, attr) => {
    const d = rel(item, name);
    return (d && ((d.attributes && d.attributes[attr]) || d[attr])) || null;
};
const items = Array.isArray(data && data.data) ? data.data : data && data.data ? [data.data] : [];
const entityFilter = selected("entity");

result = items
    .map((n) => {
        const a = n.attributes || {};
        return {
            id: n.id,
            title: a.title || null,
            body: a.body || null,
            entityId: a.entityId || null,
            entityName: a.entityName || null,
            entityType: a.entityType ? a.entityType.replace(/^./, (c) => c.toUpperCase()) : null,
            lastModifiedBy: a.lastModifiedBy || null,
            lastModified: a.lastModified || null,
            tenantId: (rel(n, "tenant") || {}).id || null,
            tenantName: relAttr(n, "tenant", "domainPrefix"),
        };
    })
    .filter((r) => !entityFilter.size || entityFilter.has(r.entityId));
