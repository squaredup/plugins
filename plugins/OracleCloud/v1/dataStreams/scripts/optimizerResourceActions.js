// One row per resource action, limited to the picked resources and statuses
// (no selection means all).
const pick = (v) => new Set([].concat(v ?? []).map((x) => (x && x.value) || x).filter(Boolean));
const statuses = pick(context.config.statuses);
const resourceIds = new Set(
    [].concat(context.config.resources ?? []).map((o) => String([].concat(o?.rawId)[0] || "").toLowerCase()).filter(Boolean),
);

result = (data?.items || [])
    .filter((a) => statuses.size === 0 || statuses.has(a.status))
    .filter((a) => resourceIds.size === 0 || resourceIds.has(String(a.resourceId || "").toLowerCase()))
    .map((a) => ({
        name: a.name,
        resourceType: a.resourceType,
        action: a.action?.description || a.action?.type || null,
        estimatedCostSaving: a.estimatedCostSaving ?? 0,
        status: a.status,
        compartmentName: a.compartmentName,
        actionUrl: a.action?.url || null,
        resourceId: a.resourceId,
        recommendationId: a.recommendationId,
        timeUpdated: a.timeUpdated,
    }));
