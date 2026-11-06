// dataStreams/scripts/alerts.js
// The v2 alerts list reports every timestamp in microseconds - convert to
// ISO 8601 here, keeping null (e.g. an alert never satisfied) as null.
// "tags" is an array, which can't be read via valueExpression even just to
// join it (see project memory), so that happens here too.
const usToIso = (us) => (us != null ? new Date(us / 1000).toISOString() : null);

result = (data.list || []).map((alert) => ({
    id: alert.alert_id,
    name: alert.name,
    description: alert.description || "",
    level: alert.level,
    lastOutcome: alert.last_outcome,
    enabled: alert.enabled,
    priority: alert.priority,
    alertType: alert.alert_type,
    isRealTime: alert.is_real_time,
    streamName: alert.stream_name,
    streamType: alert.stream_type,
    conditionType: alert.condition ? alert.condition.type : null,
    folderName: alert.folder_name,
    owner: alert.owner || "",
    tags: (alert.tags || []).join(", "),
    levelSince: usToIso(alert.level_since),
    lastOutcomeAt: usToIso(alert.last_outcome_at),
    lastOutcomeSince: usToIso(alert.last_outcome_since),
    lastTriggeredAt: usToIso(alert.last_triggered_at),
    lastSatisfiedAt: usToIso(alert.last_satisfied_at),
}));
