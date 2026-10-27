// Alerts can only be filtered by one collector or device at a time by the API, so
// object filters (including organizations, which the API cannot filter on) apply here.
const unwrap = (v) => (Array.isArray(v) ? v[0] : v);
const cfg = context.config || {};
const rawIds = (objs) => new Set((objs || []).map((o) => String(unwrap(o.rawId))));

const collectorIds = rawIds(cfg.collectors);
(cfg.organizations || []).forEach((o) => {
    const ids = Array.isArray(o.collectorIds) ? o.collectorIds : [o.collectorIds];
    ids.filter((id) => id !== undefined && id !== null).forEach((id) => collectorIds.add(String(id)));
});
const deviceIds = rawIds(cfg.devices);

const rows = ((data && data.alerts) || []).map((a) => ({
    id: a.id,
    triggeredAt: a.triggered_at,
    status: a.status,
    severity: a.severity,
    condition: a.trigger_condition_repr,
    triggerValue: a.trigger_value || [],
    closedAt: a.closed_at,
    durationSeconds: a.duration_seconds,
    collectorId: a.collector_id == null ? null : String(a.collector_id),
    deviceSourceId:
        a.collector_id == null || a.device_id == null ? null : `${a.collector_id}-${a.device_id}`,
    alertRuleId: a.alert_rule_id,
}));

result = rows.filter(
    (r) =>
        (collectorIds.size === 0 || collectorIds.has(r.collectorId)) &&
        (deviceIds.size === 0 || deviceIds.has(r.deviceSourceId)),
);
