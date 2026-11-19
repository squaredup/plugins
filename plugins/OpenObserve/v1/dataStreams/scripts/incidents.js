// dataStreams/scripts/incidents.js
// Incident timestamps are in microseconds - converted to ISO 8601 here rather
// than in valueExpressions, which can't reliably override the field they read.
// resolved_at stays null until the incident is resolved.
const usToIso = (us) => (us != null ? new Date(us / 1000).toISOString() : null);

result = (data.incidents || []).map((incident) => ({
    ...incident,
    created_at: usToIso(incident.created_at),
    updated_at: usToIso(incident.updated_at),
    first_alert_at: usToIso(incident.first_alert_at),
    last_alert_at: usToIso(incident.last_alert_at),
    resolved_at: usToIso(incident.resolved_at),
}));
