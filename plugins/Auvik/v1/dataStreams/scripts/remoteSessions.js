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
// The API only filters by last modification, so trim to sessions started in the timeframe.
const start = Date.parse(context.timeframe.start);
const end = Date.parse(context.timeframe.end);

result = items
    .map((s) => {
        const a = s.attributes || {};
        const started = a.dateStarted ? Date.parse(a.dateStarted) : NaN;
        const lastActive = a.lastActive ? Date.parse(a.lastActive) : NaN;
        return {
            id: s.id,
            dateStarted: a.dateStarted || null,
            user: a.user || null,
            category: a.category || null,
            deviceId: (rel(s, "device") || {}).id || null,
            deviceName: relAttr(s, "device", "deviceName"),
            status: a.status || null,
            durationSeconds:
                Number.isNaN(started) || Number.isNaN(lastActive) ? null : Math.max(0, Math.round((lastActive - started) / 1000)),
            direction: a.direction || null,
            cause: a.cause || null,
            details: a.data || null,
            lastActive: a.lastActive || null,
            tenantId: (rel(s, "tenant") || {}).id || null,
            tenantName: relAttr(s, "tenant", "domainPrefix"),
            _started: started,
        };
    })
    .filter((r) => Number.isNaN(r._started) || (r._started >= start && r._started <= end))
    .filter((r) => !deviceFilter.size || deviceFilter.has(r.deviceId))
    .map(({ _started, ...r }) => r);
