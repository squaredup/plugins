// Response body (served as text/plain): { status, records: [{ metricName, queryRequestsCount, lastQueryRequestTimestamp }] }
let body = data;
if (!body && typeof response?.body === 'string') {
    try { body = JSON.parse(response.body); } catch (e) { body = {}; }
}
const records = Array.isArray(body?.records) ? body.records : [];
result = records.map((r) => ({
    metric: r.metricName,
    queryRequestsCount: Number(r.queryRequestsCount),
    lastQueried: r.lastQueryRequestTimestamp ? new Date(Number(r.lastQueryRequestTimestamp) * 1000).toISOString() : null
}));
