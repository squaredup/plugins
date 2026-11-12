const payload = data && data.data;

if (!payload || !Array.isArray(payload.category)) {
    api.report.error('The Trust portal did not return Cloud Status data for the selected cloud.');
}

// Autocomplete values arrive as { value } objects in the tile editor, plain strings from the CLI.
const unwrap = (v) => (v && typeof v === 'object' ? v.value : v);
const asList = (v) => (Array.isArray(v) ? v : v ? [v] : []);
// The Cloud dropdown's value is "<cloud code>|<domain>": the API takes the code, but the portal's
// Cloud Status page is addressed by domain.
const [cloud, domain] = String(unwrap(asList(context.config.cloud)[0]) || '').split('|');
const portal = String(context.dataSources[0].baseUrl || '').replace(/\/+$/, '');
const statusPage = domain ? `${portal}/${domain}/cloud-status` : `${portal}/cloud-status`;

const severityNames = {};
for (const s of payload.severity || []) {
    severityNames[s.tid] = s.name;
}

// Same rules as Cloud Component Status: only an outage is red.
const RANK = { 'Service Disruption': 2, 'Service Degradation': 1, 'Under Investigation': 1 };
const CLOSED = ['Resolved', 'Remediated', 'Completed', 'Cancelled'];
const STATES = ['success', 'warning', 'error'];
const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;

// The API returns one fixed window: midnight UTC six days ago until now. `start_date` is that
// midnight, and each issue's `startTime` and `endTime` are minutes after it - the same numbers the
// portal uses to draw its 7-day bars. The payload's own `current_time` comes from a cached response
// and can run tens of minutes behind, so "now" is taken from the clock instead.
const weekStart = new Date(String(payload.start_date).replace(' ', 'T') + 'Z').getTime();
if (isNaN(weekStart)) {
    api.report.error('The Trust portal returned Cloud Status data without a date range.');
}
const now = Math.min(Date.now(), weekStart + 7 * 24 * HOUR - 1);

const tf = context.timeframe || {};
const tfStart = tf.start ? new Date(tf.start).getTime() : weekStart;
const tfEnd = tf.end ? new Date(tf.end).getTime() : now;

const severityOf = (e) => {
    const type = severityNames[e.severityTid] || 'Unknown';
    return { type, rank: RANK[type] || 0 };
};

const rows = [];
for (const region of payload.category) {
    for (const component of region.subCategory || []) {
        const issues = (component.issues || []).map((e) => ({
            ...e,
            ...severityOf(e),
            start: weekStart + Number(e.startTime || 0) * MINUTE,
            // An issue the portal hasn't closed yet has no end - it runs up to now.
            end: e.endTime === undefined || e.endTime === null ? now : weekStart + Number(e.endTime) * MINUTE
        }));
        // The portal's bars stop at each issue's last recorded time, but its current-status icon also
        // reflects events that are still open, so the slot holding "now" includes those too.
        const open = (component.category_status || [])
            .filter((e) => !CLOSED.includes(e.status))
            .map((e) => ({ ...e, ...severityOf(e) }));

        for (let slot = weekStart; slot <= now; slot += HOUR) {
            const slotEnd = slot + HOUR;
            if (slotEnd <= tfStart || slot >= tfEnd) continue;

            const hits = issues.filter((e) => e.start < slotEnd && e.end >= slot);
            if (now >= slot && now < slotEnd) hits.push(...open);
            const worst = hits.sort((a, b) => b.rank - a.rank)[0];

            rows.push({
                name: component.name,
                // Core cloud services come back under a single "all" group rather than real regions.
                region: region.title === 'all' ? undefined : region.title,
                time: new Date(slot).toISOString(),
                state: STATES[worst ? worst.rank : 0],
                event: worst ? worst.title : undefined,
                eventType: worst ? worst.type : undefined,
                // Never left empty - the Blocks link mapping throws on an empty link cell.
                link: worst && worst.alias ? portal + worst.alias : statusPage,
                cloud
            });
        }
    }
}

if (!payload.category.some((region) => (region.subCategory || []).length > 0)) {
    // A Commercial cloud without premium or business continuity data centers answers with empty
    // regions rather than an error.
    api.report.error(
        'The selected cloud does not publish this component type on the Trust portal. Pick one from the Component type list, which shows only the types this cloud publishes.'
    );
}

result = rows;
