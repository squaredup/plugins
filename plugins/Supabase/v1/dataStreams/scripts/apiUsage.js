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

const rows = [];
for (const point of Array.isArray(data && data.result) ? data.result : []) {
    const timestamp = new Date(point.timestamp).toISOString();
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
