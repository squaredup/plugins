// Response body: { status, data: { groups: [{ name, file, rules: [{ name, type, state, health, query, lastError, lastEvaluation, alerts, labels }] }] } }
const groups = Array.isArray(data?.data?.groups) ? data.data.groups : [];
const stateMap = { firing: 'error', pending: 'warning', inactive: 'success', ok: 'success', nodata: 'unknown' };
result = groups.flatMap((g) =>
    (Array.isArray(g.rules) ? g.rules : []).map((r) => ({
        name: r.name,
        group: g.name,
        type: r.type === 'alerting' ? 'Alerting' : r.type === 'recording' ? 'Recording' : r.type,
        state: r.type === 'alerting' ? stateMap[r.state] || 'unknown' : r.health === 'ok' ? 'success' : 'error',
        health: r.health,
        activeAlerts: Array.isArray(r.alerts) ? r.alerts.length : 0,
        query: r.query,
        lastEvaluation: r.lastEvaluation && !r.lastEvaluation.startsWith('0001') ? r.lastEvaluation : null,
        lastError: r.lastError || null,
        severity: r.labels?.severity || null
    }))
);
