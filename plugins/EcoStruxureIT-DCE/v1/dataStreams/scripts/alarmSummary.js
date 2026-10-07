// /v1/alarms/summary returns every device group in one call; the optional device group
// filter is applied here instead of calling /v1/deviceGroups/{guid}/alarmSummary per group,
// which would quickly hit the 5 requests per minute rate limit.
const unwrap = (v) => (Array.isArray(v) ? v[0] : v);

const selectedGroups = (context.config && context.config.deviceGroup) || [];
const groupIds = new Set(selectedGroups.map((o) => unwrap(o.rawId)).filter(Boolean));

const count = (n) => (typeof n === "number" ? n : 0);

result = (Array.isArray(data) ? data : [])
    .filter((g) => g && g.deviceGroupGuid)
    .filter((g) => groupIds.size === 0 || groupIds.has(g.deviceGroupGuid))
    .map((g) => {
        const critical = count(g.criticalAlarmCount);
        const warning = count(g.warningAlarmCount);
        const info = count(g.infoAlarmCount);
        return {
            deviceGroupGuid: g.deviceGroupGuid,
            criticalAlarmCount: critical,
            warningAlarmCount: warning,
            infoAlarmCount: info,
            totalAlarmCount: critical + warning + info,
            status: critical > 0 ? "error" : warning > 0 ? "warning" : "success"
        };
    });
