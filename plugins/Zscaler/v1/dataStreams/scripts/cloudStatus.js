// Parsing rules below are shared with posts.js - keep the two in step.
const channel = data && data.rss && data.rss.channel ? data.rss.channel[0] : undefined;

if (!channel) {
    api.report.error('The Trust portal did not return an RSS document.');
}

// The XML handler wraps every child element in an array, and elements with attributes
// (category, guid) become objects whose text lives in `_`.
const text = (node) => {
    let v = Array.isArray(node) ? node[0] : node;
    if (v && typeof v === 'object') {
        v = v._;
    }
    return typeof v === 'string' ? v.trim() : undefined;
};
const toDate = (s) => {
    const d = s ? new Date(s) : undefined;
    return d && !isNaN(d.getTime()) ? d : undefined;
};
const productOf = (cloud) => {
    if (/^zpa|^private\.zscaler/.test(cloud)) return 'ZPA';
    if (/^zdx/.test(cloud)) return 'ZDX';
    if (/^zidentity/.test(cloud)) return 'ZIdentity';
    if (/^ztb-/.test(cloud)) return 'Zero Trust Branch';
    if (/^zscaler|^zscloud/.test(cloud)) return 'ZIA';
    return 'Other';
};
const TYPES = { 'Recent incident': 'Incident', 'Scheduled maintenance': 'Maintenance', Advisory: 'Advisory' };

const now = new Date();
const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

const posts = [];
for (const item of channel.item || []) {
    const type = TYPES[text(item.category)];
    if (!type) continue;

    const title = text(item.title) || '';
    const link = text(item.link);
    const sep = title.lastIndexOf(' - ');
    const suffix = sep >= 0 ? title.slice(sep + 3) : '';
    let headline = sep >= 0 ? title.slice(0, sep).trim() : title;

    const clouds = [];
    for (const entry of suffix.split(',')) {
        const m = entry.trim().match(/^([^(]*?)\s*(?:\((.*)\))?$/);
        const cloud = m ? m[1].trim().toLowerCase() : '';
        if (/^[a-z0-9.-]+$/.test(cloud) && (cloud.includes('.') || /^ztb-/.test(cloud))) {
            const level = m[2] ? m[2].replace(/^FedRAMP\s*/i, '').trim() : undefined;
            clouds.push({ cloud, level: level || undefined });
        }
    }
    if (clouds.length === 0) {
        const segment = link ? link.replace(/^https?:\/\//, '').split('/')[1] : undefined;
        if (segment) {
            clouds.push({ cloud: segment.toLowerCase(), level: undefined });
        }
        headline = title;
    }

    const status = text(item.Status);
    const start = toDate(text(item.startTime));
    const end = toDate(text(item.endTime));
    const resolved = toDate(text(item.ResolvedDate));
    const pub = toDate(text(item.pubDate));

    let phase;
    if (type === 'Incident') {
        phase = ['Resolved', 'Remediated', 'Cancelled'].includes(status) || resolved ? 'Closed' : 'Active';
    } else if (type === 'Maintenance') {
        if (status === 'Upcoming') phase = 'Upcoming';
        else if (status === 'In Progress') phase = 'Active';
        else if (status === 'Completed' || status === 'Cancelled') phase = 'Closed';
        else if (start && start > now) phase = 'Upcoming';
        else if (end && end > now) phase = 'Active';
        else phase = 'Closed';
    } else {
        phase = resolved ? 'Closed' : 'Active';
    }

    posts.push({ headline, link, clouds, type, status, eventType: text(item.eventType), phase, start, when: start || pub });
}

const configured = (context.dataSources && context.dataSources[0] && context.dataSources[0].clouds) || '';
const wanted = String(configured)
    .split(',')
    .map((c) => c.trim().toLowerCase())
    .filter(Boolean);

const byCloud = new Map();
const rowFor = (cloud) => {
    if (!byCloud.has(cloud)) {
        byCloud.set(cloud, { cloud, level: undefined, posts: [] });
    }
    return byCloud.get(cloud);
};
// A configured cloud with no posts still gets a row so it shows as operational.
for (const cloud of wanted) {
    rowFor(cloud);
}
for (const post of posts) {
    for (const c of post.clouds) {
        if (wanted.length > 0 && !wanted.includes(c.cloud)) continue;
        const row = rowFor(c.cloud);
        row.level = row.level || c.level;
        row.posts.push(post);
    }
}

const latest = (list) => list.slice().sort((a, b) => (b.when || 0) - (a.when || 0))[0];
const iso = (d) => (d ? d.toISOString() : undefined);

result = Array.from(byCloud.values()).map((row) => {
    const of = (type, phase) => row.posts.filter((p) => p.type === type && p.phase === phase);
    const activeIncidents = of('Incident', 'Active');
    const activeMaintenance = of('Maintenance', 'Active');
    const upcoming = of('Maintenance', 'Upcoming');
    const advisories = of('Advisory', 'Active');
    const incidents = row.posts.filter((p) => p.type === 'Incident');

    // Only an outage turns a cloud red - degradations (often cosmetic, and sometimes left
    // "In Progress" on the portal for weeks) and incidents under monitoring are a warning.
    const isOutage = (p) => p.eventType === 'Service Disruption' && p.status !== 'Monitoring';
    const major = activeIncidents.filter(isOutage);
    const minor = activeIncidents
        .filter((p) => !isOutage(p))
        .map((p) => ({ post: p, label: p.status === 'Monitoring' ? 'Monitoring' : 'Incident' }))
        .concat(activeMaintenance.map((p) => ({ post: p, label: 'Maintenance in progress' })));

    let severity = 0;
    let state = 'success';
    let driver;
    let label;
    if (major.length > 0) {
        severity = 2;
        state = 'error';
        driver = latest(major);
        label = 'Incident';
    } else if (minor.length > 0) {
        severity = 1;
        state = 'warning';
        driver = latest(minor.map((m) => m.post));
        label = minor.find((m) => m.post === driver).label;
    }

    const nextMaintenance = upcoming
        .map((p) => p.start)
        .filter(Boolean)
        .sort((a, b) => a - b)[0];
    const lastIncident = latest(incidents.filter((p) => p.when));

    return {
        cloud: row.cloud,
        product: productOf(row.cloud),
        fedrampLevel: row.level,
        severity,
        state,
        statusText: driver ? `${label}: ${driver.headline}` : 'Operational',
        activeIncidents: activeIncidents.length,
        activeMaintenance: activeMaintenance.length,
        upcomingMaintenance: upcoming.length,
        activeAdvisories: advisories.length,
        incidentsLast30Days: incidents.filter((p) => p.when && p.when >= thirtyDaysAgo).length,
        lastIncident: iso(lastIncident && lastIncident.when),
        nextMaintenance: iso(nextMaintenance),
        currentEventLink: driver ? driver.link : undefined
    };
});
