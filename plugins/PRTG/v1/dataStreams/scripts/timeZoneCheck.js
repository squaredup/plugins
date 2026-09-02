// PRTG's legacy API interprets `filter_dstart`/`filter_dend` and reports historic
// data in the time zone of the *account* whose API key is in use, and offers no
// way to ask for UTC. That zone therefore has to be configured, and getting it
// wrong shifts Log and Sensor History by hours with nothing to show for it.
//
// It can, however, be read back: `getstatus.htm` reports the account's zone as a
// fixed offset in `UserTimeZone` (for example "UTC-03:00"). That is too coarse to
// replace the setting — Sensor History spans up to 30 days and needs the daylight
// saving transitions an IANA name carries — but it is enough to check it. This
// stream exists only for the `Time zone` step in configValidation.json, which
// treats no rows as a mismatch, so agreement has to be the non-empty case.
//
// IANA names contain only [A-Za-z0-9_+/-]; stripping other characters stops a
// quote in a custom value terminating the literal below.
const TIME_ZONE =
    '{{ (function(){ var v = dataSource.serverTimeZone; var tz = Array.isArray(v) ? (v[0] && v[0].value) : v; return String(tz || "UTC").replace(/[^A-Za-z0-9_+\/-]/g, "") || "UTC"; })() }}';

// Offset (minutes) that `zone` was running at the given instant. Read via
// formatToParts rather than a formatted string, so nothing depends on how a given
// ICU build separates the date from the time. Returns null if the parts do not
// come back as numbers, so no caller can reach `new Date(NaN)`.
const offsetAt = (instant, zone) => {
    const parts = new Intl.DateTimeFormat('en-GB', {
        timeZone: zone,
        hourCycle: 'h23',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    }).formatToParts(new Date(instant));

    const p = {};
    for (const part of parts) p[part.type] = part.value;

    const wall = Date.UTC(Number(p.year), Number(p.month) - 1, Number(p.day), Number(p.hour), Number(p.minute), Number(p.second));
    return isFinite(wall) ? Math.round((wall - instant) / 60000) : null;
};

// PRTG labels a zone by its *standard* offset in its own UI, so it is not safe to
// assume `UserTimeZone` reports the offset in force right now. Accept either the
// current offset or the standard one — daylight saving only ever adds to the
// offset, so the standard offset is the smaller of the two solstice readings in
// both hemispheres. Accepting both still catches the mistakes that matter (a zone
// picked on the wrong continent) without crying wolf every summer.
//
// An unusable zone falls back to UTC, matching what the request side in logs.json
// and sensorHistory.json does with one — the queries really are being sent as UTC
// in that case, so a non-UTC server should still be flagged.
const candidateOffsets = (zone) => {
    try {
        const now = Date.now();
        const year = new Date(now).getUTCFullYear();
        const winter = offsetAt(Date.UTC(year, 0, 1), zone);
        const summer = offsetAt(Date.UTC(year, 6, 1), zone);
        const current = offsetAt(now, zone);
        if (winter === null || summer === null || current === null) return [0];
        return [current, Math.min(winter, summer)];
    } catch (e) {
        return [0];
    }
};

// "UTC-03:00" -> -180. Also accepts a bare "UTC", tolerates the separator being
// dropped ("UTC+0530"), and reads the offset out of the bracketed form PRTG
// labels zones with in its own UI ("(UTC+01:00) Amsterdam, Berlin") in case this
// field ever carries that instead. Returns null for anything else, which the
// caller reads as "cannot tell" rather than "mismatch" — a PRTG version that
// words this field differently must not fail the check.
const parseReportedOffset = (raw) => {
    const m = String(raw == null ? '' : raw)
        .trim()
        .match(/^\(?\s*(?:UTC|GMT)(?:\s*([+-])\s*(\d{1,2}):?(\d{2})?)?\s*(?:\)|$)/i);
    if (!m) return null;
    if (!m[1]) return 0;
    const minutes = Number(m[2]) * 60 + Number(m[3] || 0);
    return m[1] === '-' ? -minutes : minutes;
};

const reportedRaw = data && typeof data === 'object' ? data.UserTimeZone : null;
const reported = parseReportedOffset(reportedRaw);

// No row means "mismatch" to configValidation, so every uncertain case has to
// return one: a value it cannot read, or a status body PRTG did not answer with.
const agrees = reported === null || candidateOffsets(TIME_ZONE).includes(reported);

result = agrees ? [{ serverTimeZone: reportedRaw === null || reportedRaw === undefined ? TIME_ZONE : String(reportedRaw) }] : [];
