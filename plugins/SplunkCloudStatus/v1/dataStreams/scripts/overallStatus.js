if (!data || !data.status || !data.components) {
    api.report.error('The Splunk Cloud status page did not return a summary document.');
}

// Statuspage's overall indicator is none | minor | major | critical | maintenance.
const STATES = { none: 'success', minor: 'warning', maintenance: 'warning', major: 'error', critical: 'error' };
const indicator = data.status.indicator;

// Group entries are containers whose status just rolls up their children, so count leaf components only.
const components = data.components.filter((c) => !c.group);
const maintenance = data.scheduled_maintenances || [];

result = [
    {
        status: data.status.description,
        state: STATES[indicator] || 'unknown',
        indicator,
        componentsAffected: components.filter((c) => c.status !== 'operational').length,
        activeIncidents: (data.incidents || []).length,
        activeMaintenance: maintenance.filter((m) => m.status === 'in_progress' || m.status === 'verifying').length,
        upcomingMaintenance: maintenance.filter((m) => m.status === 'scheduled').length,
        updatedAt: data.page && data.page.updated_at,
        link: data.page && data.page.url
    }
];
