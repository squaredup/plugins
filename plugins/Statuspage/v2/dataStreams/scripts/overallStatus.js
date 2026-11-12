if (!data || !data.status || !Array.isArray(data.components)) {
    api.report.error('The status page did not return a summary document.');
}

// The overall indicator is none | minor | major | critical | maintenance.
const STATES = { none: 'success', minor: 'warning', maintenance: 'warning', major: 'error', critical: 'error' };
const indicator = data.status.indicator;

// Group entries are containers whose status just rolls up their children, so count leaf components only.
const components = data.components.filter((c) => !c.group);

// Emulated pages (e.g. incident.io) omit this key from summary.json. Report unknown (null) rather than 0 so a
// tile never claims "0 incidents" when the page cannot say.
const incidents = Array.isArray(data.incidents) ? data.incidents : undefined;

// No upcoming-maintenance count: summary.json and upcoming.json stop at 25 windows (Cloudflare had 27), so the
// Maintenance stream filtered to Upcoming is the accurate source.
// summary.json also never lists in-progress windows, so read those from their own endpoint. `url` is the
// summary.json request URL. Unknown (null) if that endpoint isn't published.
let activeMaintenance = null;
try {
    const response = await fetch(new URL('scheduled-maintenances/active.json', url).href);
    const body = response.ok ? await response.json() : undefined;
    activeMaintenance = body && Array.isArray(body.scheduled_maintenances) ? body.scheduled_maintenances.length : null;
} catch (e) {
    activeMaintenance = null;
}

result = [
    {
        state: STATES[indicator] || 'unknown',
        status: data.status.description,
        indicator,
        componentsAffected: components.filter((c) => c.status !== 'operational').length,
        activeIncidents: incidents ? incidents.length : null,
        activeMaintenance,
        updatedAt: data.page && data.page.updated_at,
        link: data.page && data.page.url
    }
];
