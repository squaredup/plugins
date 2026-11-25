// A search returns either log events (with a logContent envelope) or, for
// queries ending in "summarize", aggregated rows with arbitrary fields.
// Events keep a capped message rather than their full payload, because full
// payloads (audit events especially) push a page past the ~6MB response cap.
const MAX_MESSAGE = 1000;
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
        message: message.length > MAX_MESSAGE ? `${message.slice(0, MAX_MESSAGE)}…` : message,
        type: log.type,
        source: log.source,
        subject: log.subject || null,
        logGroupId: log.oracle?.loggroupid || null,
        logId: log.oracle?.logid || null,
        compartmentId: log.oracle?.compartmentid || null,
    };
});
