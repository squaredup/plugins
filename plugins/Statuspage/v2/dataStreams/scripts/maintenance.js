// scheduled-maintenances.json holds the 50 most recent windows. It is the only endpoint with both upcoming and
// in-progress windows: summary.json and upcoming.json omit in-progress ones, so "active and upcoming" is this stream
// filtered by phase rather than a separate stream.
if (!data) {
    api.report.error('The status page did not return a Statuspage document.');
}

const windows = data && Array.isArray(data.scheduled_maintenances) ? data.scheduled_maintenances : [];

const toDate = (s) => {
    const d = s ? new Date(s) : undefined;
    return d && !isNaN(d.getTime()) ? d : undefined;
};

const STATUSES = { scheduled: 'Scheduled', in_progress: 'In Progress', verifying: 'Verifying', completed: 'Completed' };
const PHASES = { scheduled: 'Upcoming', in_progress: 'Active', verifying: 'Active', completed: 'Completed' };
const STATES = { Upcoming: 'unknown', Active: 'warning', Completed: 'success' };
const IMPACTS = { none: 'None', minor: 'Minor', major: 'Major', critical: 'Critical', maintenance: 'Maintenance' };

// A tile set to None still receives a (24 hour) start/end - the enum is the only reliable signal.
const tf = context.timeframe;
const filterByTime = tf && tf.enum && tf.enum !== 'none';
const windowStart = filterByTime ? toDate(tf.start) : undefined;
const windowEnd = filterByTime ? toDate(tf.end) : undefined;

// Chips may arrive as strings or { value } objects.
const rawPhases = context.config && context.config.phase;
const phases = new Set(
    (Array.isArray(rawPhases) ? rawPhases : rawPhases ? [rawPhases] : []).map((p) =>
        p && typeof p === 'object' ? p.value : p
    )
);

// rawId may itself be a single-element array.
const rawComponents = context.config && context.config.components;
const componentIds = new Set(
    (Array.isArray(rawComponents) ? rawComponents : []).map((o) => (Array.isArray(o.rawId) ? o.rawId[0] : o.rawId))
);

// The same component name can appear in several groups (one per region or deployment), and grouping by name would
// merge them. Name components as the import does: a repeated name is qualified with its group. Group names are only
// in components.json, so read it when the windows repeat a name.
const idsByName = new Map();
for (const m of windows) {
    for (const c of m.components || []) {
        if (!idsByName.has(c.name)) idsByName.set(c.name, new Set());
        idsByName.get(c.name).add(c.id);
    }
}

let componentName = (c) => c.name;
if ([...idsByName.values()].some((ids) => ids.size > 1)) {
    try {
        const response = await fetch(new URL('/api/v2/components.json', url).href);
        const body = response.ok ? await response.json() : undefined;
        if (body && Array.isArray(body.components)) {
            const groups = new Map(body.components.filter((g) => g.group).map((g) => [g.id, g.name]));
            const nameCounts = new Map();
            for (const c of body.components.filter((c) => !c.group)) {
                nameCounts.set(c.name, (nameCounts.get(c.name) || 0) + 1);
            }
            componentName = (c) => {
                const group = c.group_id && groups.get(c.group_id);
                return nameCounts.get(c.name) > 1 && group ? `${group} / ${c.name}` : c.name;
            };
        }
    } catch (e) {
        // Keep the names the windows carry.
    }
}

const rows = [];
for (const m of windows) {
    const start = toDate(m.scheduled_for);
    const end = toDate(m.scheduled_until);

    // Keep a window if it overlaps the timeframe at any point.
    if (windowStart && windowEnd && start && end) {
        if (start > windowEnd || end < windowStart) continue;
    }

    const phase = PHASES[m.status] || 'Completed';
    if (phases.size > 0 && !phases.has(phase)) continue;

    const components = m.components || [];
    if (componentIds.size > 0 && !components.some((c) => componentIds.has(c.id))) continue;

    // Updates are listed newest first, so the first update posted - the one that describes the work - is last.
    const updates = m.incident_updates || [];

    rows.push({
        id: m.id,
        name: m.name,
        status: STATUSES[m.status] || m.status,
        phase,
        state: STATES[phase],
        impact: IMPACTS[m.impact] || m.impact,
        components: components.map(componentName),
        componentIds: components.map((c) => c.id),
        scheduledFor: start && start.toISOString(),
        scheduledUntil: end && end.toISOString(),
        durationMinutes: start && end ? Math.round((end - start) / 60000) : undefined,
        description: updates.length > 0 ? updates[updates.length - 1].body : undefined,
        link: m.shortlink
    });
}

result = rows;
