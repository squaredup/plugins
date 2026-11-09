if (!data || !Array.isArray(data.components)) {
    api.report.error('The Splunk Cloud status page did not return a component list.');
}

const LEVELS = {
    operational: { label: 'Operational', state: 'success', severity: 0 },
    under_maintenance: { label: 'Under maintenance', state: 'warning', severity: 1 },
    degraded_performance: { label: 'Degraded performance', state: 'warning', severity: 2 },
    partial_outage: { label: 'Partial outage', state: 'error', severity: 3 },
    major_outage: { label: 'Major outage', state: 'error', severity: 4 }
};

// Groups are containers that only roll up their children; the children carry a group_id.
const groups = new Map(data.components.filter((c) => c.group).map((c) => [c.id, c.name]));

result = data.components
    .filter((c) => !c.group)
    .map((c) => {
        const level = LEVELS[c.status] || { label: c.status, state: 'unknown', severity: 0 };
        return {
            id: c.id,
            name: c.name,
            group: (c.group_id && groups.get(c.group_id)) || 'Ungrouped',
            status: level.label,
            state: level.state,
            severity: level.severity,
            updatedAt: c.updated_at
        };
    });
