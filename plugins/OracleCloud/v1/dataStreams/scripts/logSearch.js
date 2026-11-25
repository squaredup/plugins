// A search returns either log events (with a logContent envelope) or, for
// queries ending in "summarize", aggregated rows with arbitrary fields.
const rows = data?.results || [];

result = rows.map((row) => {
    const entry = row.data || {};
    const log = entry.logContent;
    if (!log) {
        return entry;
    }
    const payload = log.data;
    const message =
        typeof payload === "string"
            ? payload
            : payload?.message || payload?.msg || payload?.eventName || JSON.stringify(payload ?? {});
    return {
        time: log.time || entry.datetime,
        message,
        type: log.type,
        source: log.source,
        subject: log.subject || null,
        logGroupId: log.oracle?.loggroupid || null,
        logId: log.oracle?.logid || null,
        compartmentId: log.oracle?.compartmentid || null,
        data: payload ?? null,
    };
});
