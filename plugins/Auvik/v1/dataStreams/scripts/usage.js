const unwrap = (v) => (Array.isArray(v) ? v[0] : v);
const selected = (name) =>
    new Set(((context.config && context.config[name]) || []).map((o) => unwrap(o.rawId)).filter(Boolean));
const rel = (item, name) => (item.relationships && item.relationships[name] && item.relationships[name].data) || null;
const relAttr = (item, name, attr) => {
    const d = rel(item, name);
    return (d && ((d.attributes && d.attributes[attr]) || d[attr])) || null;
};
const items = Array.isArray(data && data.data) ? data.data : data && data.data ? [data.data] : [];
const tiers = ["essentials", "performance", "light", "notier", "corpitbasic", "corpitcore", "corpitadvanced"];

result = items.map((u) => {
    const a = u.attributes || {};
    const device = a.deviceUsage || {};
    const client = a.clientUsage || {};
    const period = a.usagePeriod || {};
    const row = {
        id: u.id,
        tenantName: a.domainPrefix || u.id,
        billableDays: a.billableDays ?? null,
        deviceDays: device.totalDays ?? null,
        averageDevices: device.averageDays ?? null,
        clientDays: client.totalDays ?? null,
        maxMonitoredServers: a.maxMonitoredServers ?? null,
        maxMonitoredWorkstations: a.maxMonitoredWorkstations ?? null,
        asmUsers: (a.asmUserUsage && a.asmUserUsage.totalAsmUsers) ?? null,
        periodStart: period.startDate || null,
        periodEnd: period.endDate || null,
        periodDays: period.lengthInDays ?? null,
    };
    for (const tier of tiers) {
        row["deviceDays_" + tier] = (device.totalDaysByClientType && device.totalDaysByClientType[tier]) ?? null;
    }
    return row;
});
