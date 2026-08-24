// PRTG returns historic data pivoted: each sensor channel becomes its own
// dynamically-named column, so the column set differs per sensor (a disk sensor
// yields "Free Space C:", a ping sensor "Response Time"). A declared-column data
// stream cannot express that, so unpivot to one row per channel per interval.
//
// Timestamps need care. Unlike table.json's `*_raw` columns — which are OLE
// dates in UTC — historicdata.json only ever returns `datetime` as a string in
// the PRTG server's *local* time, with no raw/epoch equivalent. Emitting that
// as-is would put this stream an hour (or more) away from `Last Check` and the
// Log stream on the same dashboard, so convert local -> UTC here using the
// configured zone, which is interpolated into this script at request time.
const TIME_ZONE =
    '{{ (function(){ var v = dataSource.serverTimeZone; var tz = Array.isArray(v) ? (v[0] && v[0].value) : v; return tz || "UTC"; })() }}';

// Offset (ms) that `zone` was running at the given instant. Reading an instant
// as a wall clock and re-parsing it as UTC yields exactly that offset.
const offsetAt = (instant, zone) => {
    const wall = new Date(instant).toLocaleString('sv-SE', { timeZone: zone });
    return Date.parse(wall.replace(' ', 'T') + 'Z') - instant;
};

// Interpret a naive wall-clock string as a time in `zone` and return real UTC.
// Applied twice so a reading that lands near a DST transition resolves against
// the offset actually in force rather than the one on the other side of it.
const wallClockToUtc = (naive, zone) => {
    let guess = naive - offsetAt(naive, zone);
    guess = naive - offsetAt(guess, zone);
    return guess;
};

// `datetime` is either a single stamp ("8/20/2026 9:04:15 PM", when avg=0) or a
// bucket range ("8/20/2026 9:00:00 PM - 9:05:00 PM"). Take the bucket start.
const parseWhen = (raw) => {
    const text = String(raw || '');
    const start = text.includes(' - ') ? text.split(' - ')[0].trim() : text.trim();
    const naive = new Date(start).getTime();
    if (isNaN(naive)) return null;

    let utc = naive;
    try {
        utc = wallClockToUtc(naive, TIME_ZONE);
    } catch (e) {
        // Unrecognised zone — fall back to treating the wall clock as UTC,
        // matching the request side's own fallback.
        utc = naive;
    }
    return new Date(utc).toISOString();
};

// "100 %" -> 100
const parseCoverage = (raw) => {
    const num = parseFloat(String(raw || '').replace('%', '').trim());
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

        // Intervals with no coverage come back as empty strings — drop them so
        // they leave a genuine gap in the chart rather than plotting as zero.
        if (raw === '' || raw === null || raw === undefined) continue;

        const value = Number(raw);
        if (isNaN(value)) continue;

        out.push({ timestamp, channel, value, coverage });
    }
}

result = out;
