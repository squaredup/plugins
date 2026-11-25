// Derive one health value per alarm from its status and severity, and keep
// only the statuses picked in the tile (all three when none are picked).
const statusParam = context.config.statuses;
const wanted = new Set([].concat(statusParam ?? []).map((s) => (s && s.value) || s).filter(Boolean));
const region = "{{ [].concat(typeof region === 'undefined' || region === null ? [] : region).map((i) => (i && i.value !== undefined ? i.value : i))[0] || [].concat(typeof resource === 'undefined' || !resource ? [] : resource).map((o) => [].concat(o.region)[0]).filter(Boolean)[0] || dataSource.homeRegion.trim() }}";

const health = (alarm) => {
    if (alarm.status === "OK") return "success";
    if (alarm.status === "SUSPENDED") return "unknown";
    return ["CRITICAL", "ERROR"].includes(alarm.severity) ? "error" : "warning";
};

result = (Array.isArray(data) ? data : [])
    .filter((alarm) => wanted.size === 0 || wanted.has(alarm.status))
    .map((alarm) => ({
        displayName: alarm.displayName,
        health: health(alarm),
        status: alarm.status,
        severity: alarm.severity,
        timestampTriggered: alarm.timestampTriggered || null,
        suppressedUntil: alarm.suppression?.timeSuppressUntil || null,
        alarmSummary: alarm.alarmSummary || null,
        region,
        id: alarm.id,
    }));
