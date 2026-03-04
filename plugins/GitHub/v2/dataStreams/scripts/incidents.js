const status = '{{status}}';
const states = '{{typeof state !== "undefined" ? state.join(",") : ""}}';

let incidents = data.incidents.map((i) => ({
    created_at: i.created_at,
    impact: i.impact,
    monitoring_at: i.monitoring_at,
    name: i.name,
    resolved_at: i.resolved_at,
    shortlink: i.shortlink,
    status: i.status,
    updated_at: i.updated_at,
}));

if (status === 'unresolved') {
    incidents = incidents.filter((i) => i.status !== 'resolved');
    if (states) {
        const stateList = states.split(',');
        incidents = incidents.filter((i) => stateList.includes(i.status));
    }
} else if (status === 'resolved') {
    incidents = incidents.filter((i) => i.status === 'resolved');
}

result = incidents;
