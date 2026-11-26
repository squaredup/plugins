// Readable category, pending resource count and the tile's category/status
// filters (no selection means all). Cloud Advisor names categories
// "cost-management-name" etc., which become "Cost management".
const pick = (v) => new Set([].concat(v ?? []).map((x) => (x && x.value) || x).filter(Boolean));
const categories = pick(context.config.category);
const statuses = pick(context.config.statuses);
const readable = (s) => String(s || "").replace(/-name$/, "").replace(/-/g, " ").replace(/^\w/, (c) => c.toUpperCase());

result = (data?.items || [])
    .filter((r) => statuses.size === 0 || statuses.has(r.status))
    .filter((r) => categories.size === 0 || [...categories].some((c) => String(r.name || "").startsWith(c.replace(/-name$/, ""))))
    .map((r) => {
        const counts = r.resourceCounts || [];
        return {
            name: readable(r.name),
            category: readable(String(r.name || "").split("-").slice(0, 2).join("-")),
            importance: r.importance,
            estimatedCostSaving: r.estimatedCostSaving ?? 0,
            pendingResources: counts.filter((c) => c.status === "PENDING").reduce((n, c) => n + (c.count || 0), 0),
            totalResources: counts.reduce((n, c) => n + (c.count || 0), 0),
            status: r.status,
            description: r.description,
            timeUpdated: r.timeUpdated,
            id: r.id,
        };
    });
