if (!data || !Array.isArray(data.scheduled_maintenances)) {
    api.report.error('The Splunk Cloud status page did not return a maintenance list.');
}

const toDate = (s) => {
    const d = s ? new Date(s) : undefined;
    return d && !isNaN(d.getTime()) ? d : undefined;
};

const STATUSES = { scheduled: 'Scheduled', in_progress: 'In progress', verifying: 'Verifying', completed: 'Completed' };
const PHASES = { scheduled: 'Upcoming', in_progress: 'Active', verifying: 'Active', completed: 'Completed' };
const STATES = { Upcoming: 'unknown', Active: 'warning', Completed: 'success' };

// A tile set to None still receives a (24 hour) start/end - the enum is the only reliable signal.
const tf = context.timeframe;
const windowStart = tf && tf.enum !== 'none' ? toDate(tf.start) : undefined;
const windowEnd = tf && tf.enum !== 'none' ? toDate(tf.end) : undefined;

const rows = [];
for (const m of data.scheduled_maintenances) {
    const start = toDate(m.scheduled_for);
    const end = toDate(m.scheduled_until);

    // Keep a window if it overlaps the timeframe at any point.
    if (windowStart && windowEnd && start && end) {
        if (start > windowEnd || end < windowStart) continue;
    }

    const phase = PHASES[m.status] || 'Completed';
    // Updates are listed newest first, so the first update posted - the one that describes the work - is last.
    const updates = m.incident_updates || [];

    rows.push({
        id: m.id,
        name: m.name,
        status: STATUSES[m.status] || m.status,
        phase,
        state: STATES[phase],
        components: (m.components || []).map((c) => c.name),
        scheduledFor: start && start.toISOString(),
        scheduledUntil: end && end.toISOString(),
        durationMinutes: start && end ? Math.round((end - start) / 60000) : undefined,
        description: updates.length > 0 ? updates[updates.length - 1].body : undefined,
        link: m.shortlink
    });
}

result = rows;
