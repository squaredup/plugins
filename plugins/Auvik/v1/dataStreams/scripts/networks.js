const unwrap = (v) => (Array.isArray(v) ? v[0] : v);
const selected = (name) =>
    new Set(((context.config && context.config[name]) || []).map((o) => unwrap(o.rawId)).filter(Boolean));
const rel = (item, name) => (item.relationships && item.relationships[name] && item.relationships[name].data) || null;
const relAttr = (item, name, attr) => {
    const d = rel(item, name);
    return (d && ((d.attributes && d.attributes[attr]) || d[attr])) || null;
};
const items = Array.isArray(data && data.data) ? data.data : data && data.data ? [data.data] : [];
const networkFilter = selected("network");

const details = {};
for (const inc of (data && data.included) || []) {
    if (inc.type === "networkDetail") details[inc.id] = inc.attributes || {};
}

result = items
    .filter((n) => !networkFilter.size || networkFilter.has(n.id))
    .map((n) => {
        const a = n.attributes || {};
        const detailRef = rel(n, "networkDetail");
        const detail = details[(detailRef && detailRef.id) || n.id] || {};
        const devices = rel(n, "devices") || [];
        return {
            id: n.id,
            name: a.networkName || n.id,
            networkType: a.networkType || null,
            scanStatus: a.scanStatus === undefined || a.scanStatus === null ? "unknown" : String(a.scanStatus),
            scope: detail.scope || null,
            deviceCount: devices.length,
            deviceIds: devices.map((d) => d.id).filter(Boolean),
            primaryCollector: detail.primaryCollector || null,
            secondaryCollectors: detail.secondaryCollectors || [],
            collectorSelection: detail.collectorSelection || null,
            description: a.description || null,
            lastModified: a.lastModified || null,
            tenantId: (rel(n, "tenant") || {}).id || null,
            tenantName: relAttr(n, "tenant", "domainPrefix"),
            link: (n.links && n.links.dashboard) || null,
        };
    });
