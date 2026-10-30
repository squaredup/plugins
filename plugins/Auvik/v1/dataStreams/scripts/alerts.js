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

// Auvik ends an alert with a separate "resolved" record and a pause with an "unpaused" one, and
// links each pair to each other through relatedAlert. Fold each ending into the record it ends,
// so one row is one alert. The platform runs this script once per page, so the link decides the
// status; the time it ended is only known when both records are on the same page.
const isEnding = (al) =>
    ["resolved", "unpaused"].includes((al.attributes || {}).status) && rel(al, "relatedAlert");
const clearedOn = {};
for (const al of items) {
    if (isEnding(al)) clearedOn[rel(al, "relatedAlert").id] = al.attributes.detectedOn || null;
}
const statusOf = (al) => {
    const s = al.attributes && al.attributes.status;
    if (s === "resolved" || s === "unpaused" || al.id in clearedOn || rel(al, "relatedAlert")) return "Resolved";
    if (s === "paused") return "Paused";
    return "Open";
};

result = items
    // A Status filter returns Auvik's records with that status as they are, where Open is a
    // "created" alert with no linked clear. Otherwise endings are folded in above, and one whose
    // alert predates the timeframe is dropped.
    .filter((al) => {
        const s = (al.attributes || {}).status;
        if (statusFilter === "open") return s === "created" && !rel(al, "relatedAlert");
        return statusFilter ? s === statusFilter : !isEnding(al);
    })
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
    .filter((r) => !entityFilter.size || entityFilter.has(r.entityId));
