// Response body: { status, data: { alerts: [{ name, state, value, labels, annotations, activeAt, group_id, ... }] } }
const alerts = Array.isArray(data?.data?.alerts) ? data.data.alerts : [];
const stateMap = { firing: 'error', pending: 'warning', inactive: 'success' };
result = alerts.map((a) => {
    const labels = a.labels || {};
    const annotations = a.annotations || {};
    const row = {
        alertname: labels.alertname || a.name,
        state: stateMap[a.state] || 'unknown',
        alertState: a.state,
        severity: labels.severity || null,
        value: a.value === undefined ? null : Number(a.value),
        activeAt: a.activeAt && !a.activeAt.startsWith('0001') ? a.activeAt : null,
        summary: annotations.summary || null,
        description: annotations.description || null,
        group: labels.alertgroup || null
    };
    Object.entries(labels).forEach(([k, v]) => {
        if (!(k in row)) row[`labels.${k}`] = v;
    });
    return row;
});
