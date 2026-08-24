// PRTG returns historic data pivoted: each sensor channel becomes its own
// dynamically-named column, so the column set differs per sensor (a disk sensor
// yields "Free Space C:", a ping sensor "Response Time"). A declared-column data
// stream cannot express that, so unpivot to one row per channel per interval.
//
// Timestamps come from the `datetime` string. historicdata.json also returns a
// `datetime_raw` OLE date, but only when `usecaption` is omitted — a mode that
// collapses every channel into one unnamed `value` column — and it carries the
// bucket end rather than its start, so neither form is usable here (checked
// against PRTG 26.3.122.1665).
//
// `datetime` is a local wall clock, so convert it to UTC with the configured
// zone, or this stream sits an hour or more from `Last Check` and the Log stream
// on the same dashboard. IANA names contain only [A-Za-z0-9_+/-]; stripping
// other characters stops a quote in a custom value terminating the literal below.
const TIME_ZONE =
    '{{ (function(){ var v = dataSource.serverTimeZone; var tz = Array.isArray(v) ? (v[0] && v[0].value) : v; return String(tz || "UTC").replace(/[^A-Za-z0-9_+\/-]/g, "") || "UTC"; })() }}';

// PRTG formats `datetime` in the account's regional setting, so the shape varies
// by installation. Parse the known forms explicitly rather than leaning on
// `new Date(str)`, which rejects the European form outright and would otherwise
// resolve the others against the *host* time zone instead of PRTG's.
// Returns a wall-clock instant expressed as if UTC, or null if unrecognised.
const parseNaive = (text) => {
    // M/D/YYYY h:mm:ss AM|PM
    let m = text.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(\d{1,2}):(\d{2}):(\d{2})(?:\s*([AaPp])\.?[Mm]\.?)?$/);
    if (m) {
        let hour = Number(m[4]);
        if (m[7]) {
            if (hour === 12) hour = 0;
            if (m[7].toUpperCase() === 'P') hour += 12;
        }
        return Date.UTC(Number(m[3]), Number(m[1]) - 1, Number(m[2]), hour, Number(m[5]), Number(m[6]));
    }
    // D.M.YYYY HH:mm:ss
    m = text.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})\s+(\d{1,2}):(\d{2}):(\d{2})$/);
    if (m) return Date.UTC(Number(m[3]), Number(m[2]) - 1, Number(m[1]), Number(m[4]), Number(m[5]), Number(m[6]));
    // YYYY-MM-DD HH:mm:ss
    m = text.match(/^(\d{4})-(\d{2})-(\d{2})[ T](\d{1,2}):(\d{2}):(\d{2})/);
    if (m) return Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]), Number(m[4]), Number(m[5]), Number(m[6]));
    return null;
};

// Offset (ms) that `zone` was running at the given instant. Read via
// formatToParts rather than a formatted string, so nothing depends on how a
// given ICU build separates the date from the time. Returns null if the parts
// do not come back as numbers, so no caller can reach `new Date(NaN)`.
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
    return isFinite(wall) ? wall - instant : null;
};

// Interpret a naive wall-clock instant as a time in `zone` and return real UTC.
// Applied twice so a reading near a DST transition resolves against the offset
// actually in force rather than the one on the other side of it.
const wallClockToUtc = (naive, zone) => {
    const first = offsetAt(naive, zone);
    if (first === null) return null;
    const second = offsetAt(naive - first, zone);
    return second === null ? null : naive - second;
};

// `datetime` is either a single stamp ("8/20/2026 9:04:15 PM", when avg=0) or a
// bucket range ("8/24/2026 11:00:00 AM - 11:05:00 AM"). Take the bucket start.
const parseWhen = (raw) => {
    const text = String(raw || '');
    const start = text.includes(' - ') ? text.split(' - ')[0].trim() : text.trim();

    const naive = parseNaive(start);
    if (naive === null || !isFinite(naive)) return null;

    let utc = naive;
    try {
        const converted = wallClockToUtc(naive, TIME_ZONE);
        // Unrecognised zone or unusable parts — fall back to treating the wall
        // clock as UTC, matching the request side's own fallback.
        if (converted !== null) utc = converted;
    } catch (e) {
        utc = naive;
    }

    return isFinite(utc) ? new Date(utc).toISOString() : null;
};

// "100 %" -> 100. Test for null/undefined rather than falsiness so a genuine
// zero reports as 0% rather than as no reading at all.
const parseCoverage = (raw) => {
    if (raw === null || raw === undefined) return null;
    const num = parseFloat(String(raw).replace('%', '').trim());
    return isNaN(num) ? null : num;
};

// historicdata.json answers HTTP 200 with the bare text "Not enough monitoring
// data" when the window holds no retained readings, so `data` is not always an object.
const rows = (data && typeof data === 'object' && data.histdata) || [];
const out = [];

for (const row of rows) {
    const timestamp = parseWhen(row.datetime);
    if (!timestamp) continue;

    const coverage = parseCoverage(row.coverage);

    for (const [channel, raw] of Object.entries(row)) {
        if (channel === 'datetime' || channel === 'coverage') continue;
        // Only present when `usecaption` is omitted, which this stream never
        // does — cheap insurance against them surfacing as channels.
        if (channel.endsWith('_raw')) continue;

        // Intervals with no coverage come back as empty strings — drop them so
        // they leave a genuine gap in the chart rather than plotting as zero.
        if (raw === '' || raw === null || raw === undefined) continue;

        const value = Number(raw);
        if (isNaN(value)) continue;

        out.push({ timestamp, channel, value, coverage });
    }
}

result = out;
