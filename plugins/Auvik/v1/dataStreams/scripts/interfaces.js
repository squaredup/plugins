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
    .map((i) => {
        const a = i.attributes || {};
        const deviceId = (rel(i, "parentDevice") || {}).id || null;
        return {
            id: i.id,
            name: a.interfaceName || i.id,
            deviceId,
            // An admin-disabled port is down by design, so report it separately from a fault.
            operationalStatus: a.adminStatus === false ? "adminDown" : a.operationalStatus || "unknown",
            adminStatus: a.adminStatus ?? null,
            interfaceType: a.interfaceType || null,
            // Reported in bits per second as a string; 0 means the speed is unknown.
            negotiatedSpeed: Number(a.negotiatedSpeed) > 0 ? Number(a.negotiatedSpeed) / 1e6 : null,
            duplex: a.duplex || null,
            macAddress: a.macAddress || null,
            ipAddresses: a.ipAddresses || [],
            networkNames: (rel(i, "networks") || []).map((n) => (n.attributes && n.attributes.networkName) || n.id).filter(Boolean),
            connectedTo: (rel(i, "connectedTo") || []).length,
            lastModified: a.lastModified || null,
            tenantId: (rel(i, "tenant") || {}).id || null,
            tenantName: relAttr(i, "tenant", "domainPrefix"),
            link: (i.links && i.links.dashboard) || null,
        };
    })
    .filter((r) => !deviceFilter.size || deviceFilter.has(r.deviceId));
