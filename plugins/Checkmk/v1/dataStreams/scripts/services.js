const SERVICE_STATES = { 0: 'OK', 1: 'WARN', 2: 'CRIT', 3: 'UNKNOWN' };

// Livestatus times are Unix seconds, with 0 meaning never
const toIso = (t) => (t ? new Date(t * 1000).toISOString() : null);

result = ((data && data.value) || []).map((s) => {
    const e = s.extensions || {};
    // A service that has never been checked still reports state 0 (OK)
    const status = e.has_been_checked === 0 ? 'PENDING' : SERVICE_STATES[e.state] || 'UNKNOWN';
    return {
        hostName: e.host_name,
        service: e.description,
        status,
        // The same value as plain text: charts see the state-shaped status column as success/warning/error
        stateName: status,
        output: e.plugin_output || null,
        // check_command carries an active check's full command line after the first '!', which can
        // include credentials (e.g. --secret=...). Keep only the check plugin name.
        plugin: (e.check_command || '').split('!')[0] || null,
        stateType: e.state_type === 1 ? 'Hard' : 'Soft',
        acknowledged: e.acknowledged === 1,
        inDowntime: e.scheduled_downtime_depth > 0 || e.host_scheduled_downtime_depth > 0,
        lastCheck: toIso(e.last_check),
        lastStateChange: toIso(e.last_state_change)
    };
});
