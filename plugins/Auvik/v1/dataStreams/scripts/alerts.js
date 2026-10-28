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
const statusFilter = context.config && context.config.status;
const levels = { emergency: 1, critical: 2, warning: 3, info: 4, unknown: 5 };

// Auvik records an alert clearing as a separate "resolved" alert whose relatedAlert is the
// alert that triggered. Fold each clear into its trigger, so one row is one alert.
const clearedOn = {};
for (const al of items) {
    const related = rel(al, "relatedAlert");
    if (al.attributes && al.attributes.status === "resolved" && related && related.id) {
        clearedOn[related.id] = (al.attributes && al.attributes.detectedOn) || null;
    }
}
const statusOf = (al) => {
    if (al.id in clearedOn) return "Resolved";
    const s = al.attributes && al.attributes.status;
    if (s === "paused") return "Paused";
    if (s === "resolved") return "Resolved";
    return "Open";
};

result = items
    // Clears are folded into their trigger above; one whose trigger predates the timeframe is dropped.
    .filter((al) => !((al.attributes || {}).status === "resolved" && rel(al, "relatedAlert")))
    .map((al) => {
        const a = al.attributes || {};
        const entity = rel(al, "entity") || {};
        return {
            id: al.id,
            name: a.name || al.id,
            severity: a.severity || "unknown",
            severityLevel: levels[a.severity] || 5,
            status: statusOf(al),
            detectedOn: a.detectedOn || null,
            resolvedOn: clearedOn[al.id] || null,
            entityId: entity.id || null,
            // Alerts with no entity, such as collector events, are raised on the tenant.
            entityType: entity.type ? entity.type.replace(/^./, (c) => c.toUpperCase()) : "Tenant",
            entityRef: entity.id ? `${entity.type.replace(/^./, (c) => c.toUpperCase())}/${entity.id}` : `Tenant/${(rel(al, "tenant") || {}).id}`,
            description: a.description || null,
            dismissed: a.dismissed ?? null,
            dispatched: a.dispatched ?? null,
            tickets: (a.externalTicket || []).map((t) => [t.system, t.id].filter(Boolean).join(": ")).filter(Boolean),
            alertDefinitionId: a.alertDefinitionId || a.specificationId || null,
            tenantId: (rel(al, "tenant") || {}).id || null,
            tenantName: relAttr(al, "tenant", "domainPrefix"),
            link: (al.links && al.links.dashboard) || null,
        };
    })
    .filter((r) => !entityFilter.size || entityFilter.has(r.entityId))
    .filter((r) => !statusFilter || r.status.toLowerCase() === statusFilter);
