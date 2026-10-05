// Shared by the alarms and alarmHistory streams, which return the same alarm shape.
// Filtering by device happens here rather than per-device (/v1/devices/{guid}/alarms)
// because the API allows only 5 requests per minute per service.
const unwrap = (v) => (Array.isArray(v) ? v[0] : v);

const selectedDevices = (context.config && context.config.device) || [];
const deviceIds = new Set(selectedDevices.map((o) => unwrap(o.rawId)).filter(Boolean));

// Times are Unix milliseconds; a resolveTime of 0 means the alarm is still active.
const toIso = (ms) => (typeof ms === "number" && ms > 0 ? new Date(ms).toISOString() : null);

result = (Array.isArray(data) ? data : [])
    .filter((a) => a && a.isxcGuid)
    .filter((a) => deviceIds.size === 0 || deviceIds.has(a.deviceGuid))
    .map((a) => ({
        isxcGuid: a.isxcGuid,
        description: a.description,
        severityText: a.severityText,
        severity: a.severity,
        startTime: toIso(a.startTime),
        resolveTime: toIso(a.resolveTime),
        durationSeconds:
            typeof a.startTime === "number" && a.startTime > 0
                ? Math.round(((a.resolveTime > 0 ? a.resolveTime : Date.now()) - a.startTime) / 1000)
                : null,
        deviceGuid: a.deviceGuid,
        sensorGuid: a.sensorGuid,
        recommendedAction: a.recommendedAction,
        hidden: a.hidden,
        alarmAlertSuppressed: a.alarmAlertSuppressed,
        manuallyResolvable: a.manuallyResolvable,
        commentCount: a.commentCount
    }));
