// dataStreams/scripts/alerts.js
// Adds derived columns to each alert. State and duration are computed here
// because a metadata valueExpression reads the shaped value of a column and
// cannot compare raw enums or two timestamps reliably.
const unwrap = (v) => (Array.isArray(v) ? v[0] : v);
const selected = (context.config && context.config.alertSource) || [];
const sourceName = selected.length === 1 ? unwrap(selected[0].name) : null;
const now = Date.now();

result = (data.alerts || []).map((alert) => {
    const isFiring = alert.status === 'firing';
    const start = Date.parse(alert.created_at);
    const end = alert.resolved_at ? Date.parse(alert.resolved_at) : now;
    const minutes = Number.isNaN(start) || Number.isNaN(end) ? null : Math.max(0, (end - start) / 60000);
    return {
        ...alert,
        isFiring,
        alertState: isFiring ? 'error' : alert.status === 'resolved' ? 'success' : 'unknown',
        durationMinutes: isFiring || alert.resolved_at ? minutes : null,
        alertSourceName: sourceName,
    };
});
