const project = context.objects[0];
const services = [
    ['Data API', 'total_rest_requests'],
    ['Auth', 'total_auth_requests'],
    ['Storage', 'total_storage_requests'],
    ['Realtime', 'total_realtime_requests']
];

if (data && data.error) {
    throw new Error(typeof data.error === 'string' ? data.error : JSON.stringify(data.error));
}

// Timestamps can arrive as UTC without a zone suffix
const toIso = (value) => {
    if (typeof value !== 'string' || !value) return null;
    const date = new Date(/(Z|[+-]\d\d:?\d\d)$/.test(value) ? value : `${value}Z`);
    return Number.isNaN(date.getTime()) ? null : date.toISOString();
};

const rows = [];
for (const point of Array.isArray(data && data.result) ? data.result : []) {
    const timestamp = toIso(point.timestamp);
    if (!timestamp) continue;
    for (const [service, key] of services) {
        rows.push({
            timestamp,
            service,
            requests: Number(point[key]) || 0,
            projectRef: project.rawId,
            projectName: project.name
        });
    }
}
result = rows;
