if (!data || !Array.isArray(data.incidents)) {
    api.report.error('The status page did not return an incident list.');
}

const toDate = (s) => {
    const d = s ? new Date(s) : undefined;
    return d && !isNaN(d.getTime()) ? d : undefined;
};

// Toggles arrive as a boolean or the string "true"; multi-select chips as an array (possibly of { value } objects).
const config = context.config || {};
const isOn = (v) => v === true || v === 'true';
const toList = (v) =>
    (Array.isArray(v) ? v : v === undefined || v === null || v === '' ? [] : [v])
        .map((x) => (x && typeof x === 'object' ? x.value : x))
        .filter((x) => x !== undefined && x !== null && x !== '')
        .map((x) => String(x).toLowerCase());

const oneRowPerComponent = isOn(config.oneRowPerComponent);
const phaseFilter = new Set(toList(config.phase));
const impactFilter = new Set(toList(config.impact));

// Selected components arrive as objects whose rawId may itself be a single-element array.
const selectedComponents = new Set(
    (Array.isArray(config.components) ? config.components : [])
        .map((o) => (Array.isArray(o.rawId) ? o.rawId[0] : o.rawId))
        .filter(Boolean)
);

// A tile set to None still receives a (24 hour) start/end - the enum is the only reliable signal.
// The active incidents stream has no timeframe at all.
const tf = context.timeframe;
const windowStart = tf && tf.enum !== 'none' ? toDate(tf.start) : undefined;
const windowEnd = tf && tf.enum !== 'none' ? toDate(tf.end) : undefined;
const now = new Date();

const IMPACT_LABELS = {
    none: 'None',
    minor: 'Minor',
    major: 'Major',
    critical: 'Critical',
    maintenance: 'Maintenance'
};
const STATUS_LABELS = {
    investigating: 'Investigating',
    identified: 'Identified',
    monitoring: 'Monitoring',
    resolved: 'Resolved',
    postmortem: 'Postmortem'
};
const label = (map, v) => (v === undefined || v === null ? undefined : map[v] || v);

// The incident's own `impact` is set by hand and often understates it (a "Major Outage" can be filed as
// minor), so also report the worst status any component reached during the incident.
const COMPONENT_LEVELS = [
    ['operational', 'Operational'],
    ['under_maintenance', 'Under Maintenance'],
    ['degraded_performance', 'Degraded Performance'],
    ['partial_outage', 'Partial Outage'],
    ['major_outage', 'Major Outage']
];
const worstComponentStatus = (updates) => {
    let worst = -1;
    for (const update of updates) {
        for (const affected of update.affected_components || []) {
            worst = Math.max(
                worst,
                COMPONENT_LEVELS.findIndex(([key]) => key === affected.new_status)
            );
        }
    }
    return worst >= 0 ? COMPONENT_LEVELS[worst][1] : undefined;
};

// An incident's own component list can be empty or shorter than what its updates record as affected, so the
// updates' components count too. Updates name a grouped component "Group - Name"; the update's name is the fallback
// when components.json no longer lists the component.
const updateNames = new Map();
const updateOnlyCodes = (incident) => {
    const own = new Set((incident.components || []).map((c) => c.id));
    const codes = new Set();
    for (const update of incident.incident_updates || []) {
        for (const c of update.affected_components || []) {
            if (c.code && !own.has(c.code)) {
                codes.add(c.code);
                if (!updateNames.has(c.code)) updateNames.set(c.code, c.name);
            }
        }
    }
    return codes;
};

// The same component name can appear in several groups (Duo has an "Admin Panel" per deployment), and grouping or
// filtering by name would merge them. Name components as the import does: a repeated name is qualified with its
// group. Whether a name repeats is decided across the whole page, not just these incidents, so a component keeps
// the same name in every tile. Group names are only in components.json, so read it whenever there is a component
// to name.
const needsList = data.incidents.some(
    (incident) => (incident.components || []).length > 0 || updateOnlyCodes(incident).size > 0
);

let componentName = (id, fallback) => fallback;
if (needsList) {
    try {
        // `url` is incidents.json or incidents/unresolved.json, so resolve from the host.
        const response = await fetch(new URL('/api/v2/components.json', url).href);
        const body = response.ok ? await response.json() : undefined;
        if (body && Array.isArray(body.components)) {
            const byId = new Map(body.components.map((c) => [c.id, c]));
            const nameCounts = new Map();
            for (const c of body.components.filter((c) => !c.group)) {
                nameCounts.set(c.name, (nameCounts.get(c.name) || 0) + 1);
            }
            componentName = (id, fallback) => {
                const c = byId.get(id);
                if (!c) return fallback;
                const group = c.group_id && byId.get(c.group_id);
                return nameCounts.get(c.name) > 1 && group ? `${group.name} / ${c.name}` : c.name;
            };
        }
    } catch (e) {
        // Keep the names the incidents carry.
    }
}

const rows = [];
for (const incident of data.incidents) {
    const started = toDate(incident.started_at || incident.created_at);
    const resolved = toDate(incident.resolved_at);
    const closed = incident.status === 'resolved' || incident.status === 'postmortem';
    const phase = closed ? 'Resolved' : 'Active';
    const impact = label(IMPACT_LABELS, incident.impact);

    if (phaseFilter.size > 0 && !phaseFilter.has(phase.toLowerCase())) continue;
    if (impactFilter.size > 0 && !impactFilter.has(String(impact).toLowerCase())) continue;

    // Keep an incident if it was open at any point in the window, so a long one that began before the
    // window but is still running is not dropped.
    if (windowStart && windowEnd && started) {
        const end = resolved || now;
        if (started > windowEnd || end < windowStart) continue;
    }

    // Updates are listed newest first.
    const updates = incident.incident_updates || [];
    const affected = (incident.components || []).map((c) => ({ id: c.id, name: componentName(c.id, c.name) }));
    for (const code of updateOnlyCodes(incident)) {
        affected.push({ id: code, name: componentName(code, updateNames.get(code)) });
    }

    if (selectedComponents.size > 0 && !affected.some((c) => selectedComponents.has(c.id))) continue;

    let state = 'success';
    if (!closed) {
        state = incident.impact === 'critical' || incident.impact === 'major' ? 'error' : 'warning';
    }

    const row = {
        state,
        id: incident.id,
        name: incident.name,
        impact,
        worstComponentStatus: worstComponentStatus(updates),
        status: label(STATUS_LABELS, incident.status),
        phase,
        startedAt: started && started.toISOString(),
        resolvedAt: resolved && closed ? resolved.toISOString() : undefined,
        updatedAt: incident.updated_at,
        // Some pages record a resolve time earlier than the start time; that isn't a real duration.
        timeToResolveMinutes:
            started && resolved && closed && resolved >= started ? Math.round((resolved - started) / 60000) : undefined,
        updateCount: updates.length,
        latestUpdate: updates.length > 0 ? updates[0].body : undefined,
        link: incident.shortlink
    };

    if (oneRowPerComponent && affected.length > 0) {
        for (const c of affected) {
            if (selectedComponents.size > 0 && !selectedComponents.has(c.id)) continue;
            rows.push({ ...row, components: [c.name], componentIds: [c.id] });
        }
    } else {
        rows.push({ ...row, components: affected.map((c) => c.name), componentIds: affected.map((c) => c.id) });
    }
}

result = rows;
