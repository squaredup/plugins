const HOST_STATES = { 0: 'UP', 1: 'DOWN', 2: 'UNREACHABLE' };
const SERVICE_STATES = { 0: 'OK', 1: 'WARN', 2: 'CRIT', 3: 'UNKNOWN' };

// Worst first, in Checkmk severity order: a down host outranks any service, and among services
// CRIT outranks UNKNOWN outranks WARN.
const HEALTH_RANK = { DOWN: 6, UNREACHABLE: 5, CRIT: 4, UNKNOWN: 3, WARN: 2, PENDING: 1, OK: 0 };

// Livestatus times are Unix seconds, with 0 meaning never
const toIso = (t) => (t ? new Date(t * 1000).toISOString() : null);

result = ((data && data.value) || []).map((h) => {
    const e = h.extensions || {};
    // A host that has never been checked still reports state 0 (UP)
    const status = e.has_been_checked === 0 ? 'PENDING' : HOST_STATES[e.state] || 'UNKNOWN';
    const worstServiceState = e.num_services ? SERVICE_STATES[e.worst_service_state] || 'UNKNOWN' : null;
    const health = status === 'UP' ? worstServiceState || 'OK' : status;
    return {
        hostName: e.name || h.id,
        status,
        // Plain-text copies: charts see state-shaped columns as success/warning/error
        statusName: status,
        output: e.plugin_output || null,
        worstServiceState,
        worstServiceStateName: worstServiceState,
        health,
        healthRank: HEALTH_RANK[health] || 0,
        services: e.num_services || 0,
        servicesOk: e.num_services_ok || 0,
        servicesWarn: e.num_services_warn || 0,
        servicesCrit: e.num_services_crit || 0,
        servicesUnknown: e.num_services_unknown || 0,
        servicesPending: e.num_services_pending || 0,
        acknowledged: e.acknowledged === 1,
        inDowntime: e.scheduled_downtime_depth > 0,
        alias: e.alias || null,
        address: e.address || null,
        lastCheck: toIso(e.last_check),
        lastStateChange: toIso(e.last_state_change)
    };
});
