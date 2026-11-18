if (!data || !Array.isArray(data.components)) {
    api.report.error('The status page did not return a component list.');
}

const LEVELS = {
    operational: { label: 'Operational', state: 'success', severity: 0 },
    under_maintenance: { label: 'Under Maintenance', state: 'warning', severity: 1 },
    degraded_performance: { label: 'Degraded Performance', state: 'warning', severity: 2 },
    partial_outage: { label: 'Partial Outage', state: 'error', severity: 3 },
    major_outage: { label: 'Major Outage', state: 'error', severity: 4 }
};

// The object picker's rawId can itself be a single-element array, so unwrap it. Empty/absent means no filter.
const selected = (context.config && context.config.components) || [];
const wanted = new Set(
    (Array.isArray(selected) ? selected : [selected])
        .filter(Boolean)
        .map((o) => (Array.isArray(o.rawId) ? o.rawId[0] : o.rawId))
        .filter((id) => id !== undefined && id !== null)
);

// Groups are containers that only roll up their children; the children carry a group_id.
const groups = new Map(data.components.filter((c) => c.group).map((c) => [c.id, c.name]));

result = data.components
    .filter((c) => !c.group && (wanted.size === 0 || wanted.has(c.id)))
    .map((c) => {
        const level = LEVELS[c.status] || { label: c.status, state: 'unknown', severity: 0 };
        return {
            state: level.state,
            name: c.name,
            id: c.id,
            group: (c.group_id && groups.get(c.group_id)) || 'Ungrouped',
            status: level.label,
            severity: level.severity,
            description: c.description || undefined,
            updatedAt: c.updated_at
        };
    });
