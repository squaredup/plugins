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
const now = Date.now();

result = items
    .map((c) => {
        const a = c.attributes || {};
        const deviceId = (rel(c, "device") || {}).id || null;
        const backedUp = a.backupTime ? Date.parse(a.backupTime) : NaN;
        return {
            id: c.id,
            deviceId,
            deviceName: relAttr(c, "device", "deviceName") || deviceId,
            backupTime: a.backupTime || null,
            ageDays: Number.isNaN(backedUp) ? null : Math.floor((now - backedUp) / 86400000),
            isRunning: a.isRunning ?? null,
            tenantId: (rel(c, "tenant") || {}).id || null,
            tenantName: relAttr(c, "tenant", "domainPrefix"),
        };
    })
    .filter((r) => !deviceFilter.size || deviceFilter.has(r.deviceId));
