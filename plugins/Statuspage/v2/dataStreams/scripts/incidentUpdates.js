if (!data || !Array.isArray(data.incidents)) {
    api.report.error('The status page did not return an incident list.');
}

const toDate = (s) => {
    const d = s ? new Date(s) : undefined;
    return d && !isNaN(d.getTime()) ? d : undefined;
};

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
const COMPONENT_STATUS_LABELS = {
    operational: 'Operational',
    under_maintenance: 'Under Maintenance',
    degraded_performance: 'Degraded Performance',
    partial_outage: 'Partial Outage',
    major_outage: 'Major Outage'
};
const componentStatus = (s) => (s ? COMPONENT_STATUS_LABELS[s] || s : undefined);

const config = context.config || {};
const oneRowPerComponent = config.oneRowPerComponent === true || config.oneRowPerComponent === 'true';

// The picker may deliver rawId as a single-element array.
const selected = new Set(
    (Array.isArray(config.components) ? config.components : [])
        .map((o) => (Array.isArray(o.rawId) ? o.rawId[0] : o.rawId))
        .filter(Boolean)
);

// A tile set to None still receives a (24 hour) start/end - the enum is the only reliable signal.
const tf = context.timeframe;
const windowStart = tf && tf.enum !== 'none' ? toDate(tf.start) : undefined;
const windowEnd = tf && tf.enum !== 'none' ? toDate(tf.end) : undefined;

const rows = [];
for (const incident of data.incidents) {
    const started = toDate(incident.started_at || incident.created_at);
    const updates = (incident.incident_updates || [])
        .map((u) => ({ u, at: toDate(u.display_at || u.created_at) }))
        // Statuspage lists updates newest first; order oldest first so the sequence number reads naturally.
        .sort((a, b) => (a.at || 0) - (b.at || 0));

    updates.forEach(({ u, at }, index) => {
        if (windowStart && windowEnd && at && (at < windowStart || at > windowEnd)) return;

        const affected = u.affected_components || [];
        const touched = selected.size > 0 ? affected.filter((a) => selected.has(a.code)) : affected;
        if (selected.size > 0 && touched.length === 0) return;

        // A start time recorded after the first post would give a negative offset; leave it empty instead.
        const minutes = started && at ? Math.round((at - started) / 60000) : undefined;
        const blank = { componentName: undefined, componentId: undefined, oldStatus: undefined, newStatus: undefined };

        const base = {
            incidentName: incident.name,
            id: u.id,
            incidentId: incident.id,
            impact: IMPACT_LABELS[incident.impact] || incident.impact,
            status: STATUS_LABELS[u.status] || u.status,
            postedAt: at && at.toISOString(),
            body: u.body,
            transitions: touched.map(
                (a) => `${a.name}: ${componentStatus(a.old_status)} → ${componentStatus(a.new_status)}`
            ),
            components: touched.map((a) => a.name),
            componentIds: touched.map((a) => a.code),
            sequence: index + 1,
            minutesSinceStart: minutes !== undefined && minutes >= 0 ? minutes : null,
            link: incident.shortlink
        };

        if (oneRowPerComponent && touched.length > 0) {
            for (const a of touched) {
                rows.push({
                    ...base,
                    componentName: a.name,
                    componentId: a.code,
                    oldStatus: componentStatus(a.old_status),
                    newStatus: componentStatus(a.new_status)
                });
            }
        } else {
            rows.push({ ...base, ...blank });
        }
    });
}

result = rows;
