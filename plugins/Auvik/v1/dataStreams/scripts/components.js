const unwrap = (v) => (Array.isArray(v) ? v[0] : v);
const selected = (name) =>
    new Set(((context.config && context.config[name]) || []).map((o) => unwrap(o.rawId)).filter(Boolean));
const rel = (item, name) => (item.relationships && item.relationships[name] && item.relationships[name].data) || null;
const relAttr = (item, name, attr) => {
    const d = rel(item, name);
    return (d && ((d.attributes && d.attributes[attr]) || d[attr])) || null;
};
const items = Array.isArray(data && data.data) ? data.data : data && data.data ? [data.data] : [];
const deviceFilter = selected("device");

result = items
    .map((c) => {
        const a = c.attributes || {};
        return {
            id: c.id,
            name: a.componentName || c.id,
            deviceId: (rel(c, "parentDevice") || {}).id || null,
            deviceName: relAttr(c, "parentDevice", "deviceName"),
            currentStatus: a.currentStatus || null,
            componentType: a.componentType || null,
            lastModified: a.lastModified || null,
            tenantId: (rel(c, "tenant") || {}).id || null,
            tenantName: relAttr(c, "tenant", "domainPrefix"),
            link: (c.links && c.links.dashboard) || null,
        };
    })
    .filter((r) => !deviceFilter.size || deviceFilter.has(r.deviceId));
