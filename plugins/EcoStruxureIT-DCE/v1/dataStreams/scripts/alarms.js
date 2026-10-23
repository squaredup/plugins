// Shared by the alarms and alarmHistory streams, which return the same alarm shape.
// Filtering by device happens here rather than per-device (/v1/devices/{guid}/alarms)
// because the API allows only 5 requests per minute per service.
const unwrap = (v) => (Array.isArray(v) ? v[0] : v);

const selectedDevices = (context.config && context.config.device) || [];
const deviceIds = new Set(selectedDevices.map((o) => unwrap(o.rawId)).filter(Boolean));

// One device group is read from /v1/deviceGroups/{guid}/alarms. Alarms don't say which group
// they belong to, so several groups can't be filtered from /v1/alarms; refuse rather than
// silently returning every alarm.
const selectedGroups = (context.config && context.config.deviceGroup) || [];
if (Array.isArray(selectedGroups) && selectedGroups.length > 1) {
    throw new Error("Select a single device group. Active Alarms can only filter by one device group at a time.");
}

// Times are Unix milliseconds; a resolveTime of 0 means the alarm is still active.
const toIso = (ms) => (typeof ms === "number" && ms > 0 ? new Date(ms).toISOString() : null);

// An alarm only carries its sensor's ID, not the sensor's kind, so classify it from its
// description (e.g. "Temperature violation", "Leak detected").
const ENVIRONMENTAL = /temperature|humidity|dew point|air ?flow|leak|fluid|water|smoke|door|motion|cooling/i;
const POWER = /power|voltage|current|battery|load|outlet|input|output|bypass|frequency|phase|runtime|ups/i;
const categoryOf = (description) =>
    ENVIRONMENTAL.test(description || "") ? "Environmental" : POWER.test(description || "") ? "Power" : "Other";

result = (Array.isArray(data) ? data : [])
    .filter((a) => a && a.isxcGuid)
    .filter((a) => deviceIds.size === 0 || deviceIds.has(a.deviceGuid))
    .map((a) => ({
        isxcGuid: a.isxcGuid,
        description: a.description,
        category: categoryOf(a.description),
        severityText: a.severityText,
        // DCE's own wording for badges; severityText becomes a mapped health state.
        statusText: a.severityText || "Unknown",
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
