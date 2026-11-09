if (!data || !Array.isArray(data.incidents)) {
    api.report.error('The Splunk Cloud status page did not return an incident list.');
}

const toDate = (s) => {
    const d = s ? new Date(s) : undefined;
    return d && !isNaN(d.getTime()) ? d : undefined;
};
const capitalise = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);

const config = context.config || {};
const oneRowPerComponent = config.oneRowPerComponent === true || config.oneRowPerComponent === 'true';

// A tile set to None still receives a (24 hour) start/end - the enum is the only reliable signal.
const tf = context.timeframe;
const windowStart = tf && tf.enum !== 'none' ? toDate(tf.start) : undefined;
const windowEnd = tf && tf.enum !== 'none' ? toDate(tf.end) : undefined;
const now = new Date();

// The incident's own `impact` is set by hand and often understates it (a "Major Outage" can be filed as
// minor), so also report the worst status any component reached during the incident.
const COMPONENT_LEVELS = [
    ['operational', 'Operational'],
    ['under_maintenance', 'Under maintenance'],
    ['degraded_performance', 'Degraded performance'],
    ['partial_outage', 'Partial outage'],
    ['major_outage', 'Major outage']
];
const worstComponentStatus = (updates) => {
    let worst = -1;
    for (const update of updates) {
        for (const affected of update.affected_components || []) {
            worst = Math.max(worst, COMPONENT_LEVELS.findIndex(([key]) => key === affected.new_status));
        }
    }
    return worst >= 0 ? COMPONENT_LEVELS[worst][1] : undefined;
};

const rows = [];
for (const incident of data.incidents) {
    const started = toDate(incident.started_at || incident.created_at);
    const resolved = toDate(incident.resolved_at);
    const closed = incident.status === 'resolved' || incident.status === 'postmortem';

    // Keep an incident if it was open at any point in the window, so a long one that began before the
    // window but is still running is not dropped.
    if (windowStart && windowEnd && started) {
        const end = resolved || now;
        if (started > windowEnd || end < windowStart) continue;
    }

    let state = 'success';
    if (!closed) {
        state = incident.impact === 'critical' || incident.impact === 'major' ? 'error' : 'warning';
    }

    // Updates are listed newest first.
    const updates = incident.incident_updates || [];
    const names = (incident.components || []).map((c) => c.name);

    const row = {
        id: incident.id,
        name: incident.name,
        impact: capitalise(incident.impact),
        worstComponentStatus: worstComponentStatus(updates),
        status: capitalise(incident.status),
        phase: closed ? 'Resolved' : 'Active',
        state,
        startedAt: started && started.toISOString(),
        resolvedAt: resolved && closed ? resolved.toISOString() : undefined,
        updatedAt: incident.updated_at,
        // Splunk occasionally records a resolve time earlier than the start time; that isn't a real duration.
        timeToResolveMinutes: started && resolved && closed && resolved >= started ? Math.round((resolved - started) / 60000) : undefined,
        updateCount: updates.length,
        latestUpdate: updates.length > 0 ? updates[0].body : undefined,
        link: incident.shortlink
    };

    if (oneRowPerComponent && names.length > 1) {
        for (const name of names) {
            rows.push({ ...row, components: [name] });
        }
    } else {
        rows.push({ ...row, components: names });
    }
}

result = rows;
