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

// Same rule as the RSS streams: only an outage turns a component red.
const RANK = { 'Service Disruption': 2, 'Service Degradation': 1, 'Under Investigation': 1 };
const CLOSED = ['Resolved', 'Remediated', 'Completed', 'Cancelled'];

const stripHtml = (s) =>
    s
        ? String(s)
              .replace(/<[^>]+>/g, ' ')
              .replace(/&nbsp;/g, ' ')
              .replace(/&amp;/g, '&')
              .replace(/\s+/g, ' ')
              .trim() || undefined
        : undefined;

// `ri_date` is "YYYY-MM-DD HH:MM:SS" in UTC - the RFC-822 `from` string beside it carries the same time.
const toIso = (s) => {
    const d = s ? new Date(String(s).replace(' ', 'T') + 'Z') : undefined;
    return d && !isNaN(d.getTime()) ? d.toISOString() : undefined;
};

const rows = [];
for (const region of payload.category) {
    for (const component of region.subCategory || []) {
        const active = (component.category_status || [])
            .filter((e) => !CLOSED.includes(e.status))
            .map((e) => {
                const type = severityNames[e.severityTid] || 'Unknown';
                return { ...e, type, rank: RANK[type] || 0 };
            })
            .sort((a, b) => b.rank - a.rank || String(b.ri_date).localeCompare(String(a.ri_date)));
        const top = active[0];
        const severity = top ? top.rank : 0;

        rows.push({
            name: component.name,
            // Core cloud services come back under a single "all" group rather than real regions.
            region: region.title === 'all' ? undefined : region.title,
            severity,
            state: severity === 2 ? 'error' : severity === 1 ? 'warning' : 'success',
            statusText: top ? `${top.type}: ${top.title}` : 'Operational',
            activeEvents: active.length,
            eventTitle: top ? top.title : undefined,
            eventType: top ? top.type : undefined,
            eventStatus: top ? top.status : undefined,
            eventStart: top ? toIso(top.ri_date) : undefined,
            eventSummary: top ? stripHtml(top.short_description) : undefined,
            // Never left empty - the Blocks link mapping throws on an empty link cell.
            link: top && top.alias ? portal + top.alias : statusPage,
            cloud
        });
    }
}

// A Commercial cloud without premium or business continuity data centers answers with empty regions
// rather than an error.
if (rows.length === 0) {
    api.report.error(
        'The selected cloud does not publish this component type on the Trust portal. Pick one from the Component type list, which shows only the types this cloud publishes.'
    );
}

result = rows;
