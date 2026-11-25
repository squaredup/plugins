// Audit events arrive as CloudEvents inside the log search envelope; pull out
// who did what to which resource, and whether it succeeded.
result = (data?.results || []).map((row) => {
    const log = row.data?.logContent || {};
    const event = log.data || {};
    const status = String(event.response?.status ?? "");
    return {
        time: log.time || row.data?.datetime,
        eventName: event.eventName || log.type,
        principalName: event.identity?.principalName || null,
        action: event.request?.action || null,
        status: status || null,
        outcome: !status ? "unknown" : /^[23]/.test(status) ? "success" : "error",
        resourceName: event.resourceName || null,
        compartmentName: event.compartmentName || null,
        ipAddress: event.identity?.ipAddress || null,
        userAgent: event.identity?.userAgent || null,
        source: log.source || null,
    };
});
