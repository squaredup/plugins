// PRTG returns historic data pivoted: each sensor channel becomes its own
// dynamically-named column, so the column set differs per sensor (a disk sensor
// yields "Free Space C:", a ping sensor "Response Time"). A declared-column data
// stream cannot express that, so unpivot to one row per channel per interval.
//
// This reads historicdata.csv rather than historicdata.json because only the CSV
// (and XML) carries both the channel names and `Date Time(RAW)`, a UTC OLE date.
// The JSON form either names every channel `value` or, with `usecaption`, drops
// the raw date and leaves only local wall-clock text. With a UTC timestamp on
// every row, nothing here needs to know the PRTG account's time zone.
//
// `Date Time(RAW)` is the reading time for raw data, but the bucket *end* for
// averaged data, so the bucket start is found by subtracting the averaging
// interval (checked against PRTG 26.3.122.1665 for 5-minute, hourly and daily
// buckets).
//
// The request window is sent widened by 12 hours before and 14 hours after,
// because PRTG reads `sdate`/`edate` in the account's zone, which can be anywhere
// from UTC-12 to UTC+14. Rows outside the real timeframe are dropped here.

const MAX_RANGE = 30 * 86400000;

// Same rule as the `avg` getArg in sensorHistory.json.
const toMs = (v) => (typeof v === 'number' ? (v < 1e12 ? v * 1000 : v) : new Date(v).getTime());
const tf = (context && context.timeframe) || {};
const end = toMs(tf.end);
const start = Math.max(toMs(tf.start), end - MAX_RANGE);
const average = context && context.config ? context.config.average : undefined;
const avgSeconds = Number(average || (toMs(tf.end) - toMs(tf.start) > 604800000 ? 3600 : 300)) || 0;
const bucketMs = avgSeconds * 1000;

// OLE automation date (days since 1899-12-30, UTC) to epoch milliseconds.
const oleToMs = (raw) => Math.round((Number(raw) - 25569) * 86400000);

// Minimal CSV reader: quoted fields, doubled quotes inside them, and whichever
// delimiter follows the first header field (PRTG quotes every field).
const parseCsv = (text) => {
    const firstQuote = text.indexOf('"', 1);
    const delimiter = firstQuote > 0 && text[firstQuote + 1] && text[firstQuote + 1] !== '"' ? text[firstQuote + 1] : ',';
    const rows = [];
    let row = [];
    let field = '';
    let quoted = false;
    for (let i = 0; i < text.length; i++) {
        const ch = text[i];
        if (quoted) {
            if (ch === '"') {
                if (text[i + 1] === '"') {
                    field += '"';
                    i++;
                } else {
                    quoted = false;
                }
            } else {
                field += ch;
            }
        } else if (ch === '"') {
            quoted = true;
        } else if (ch === delimiter) {
            row.push(field);
            field = '';
        } else if (ch === '\n' || ch === '\r') {
            if (ch === '\r' && text[i + 1] === '\n') i++;
            row.push(field);
            rows.push(row);
            row = [];
            field = '';
        } else {
            field += ch;
        }
    }
    if (field !== '' || row.length) {
        row.push(field);
        rows.push(row);
    }
    return rows;
};

// historicdata answers HTTP 200 with the bare text "Not enough monitoring data"
// when the window holds no retained readings, so check for the header first.
const body = response && typeof response.body === 'string' ? response.body : '';
const table = body.startsWith('"') ? parseCsv(body) : [];
const header = table[0] || [];

// Each channel appears as a "Name" / "Name(RAW)" pair; read the raw half.
const rawIndex = {};
header.forEach((name, i) => {
    if (name.endsWith('(RAW)')) rawIndex[name.slice(0, -5)] = i;
});
const timeIndex = rawIndex['Date Time'];
const coverageIndex = rawIndex['Coverage'];
const channels = Object.keys(rawIndex).filter((name) => name !== 'Date Time' && name !== 'Coverage');

const out = [];
for (const cells of table.slice(1)) {
    // Skips the trailing "Averages (of N values)" row, whose second cell is text.
    const raw = cells[timeIndex];
    if (raw === undefined || raw === '' || isNaN(Number(raw))) continue;

    const reported = oleToMs(raw);
    const bucketStart = reported - bucketMs;
    // Keep any bucket that overlaps the timeframe; a raw reading is a point.
    if (bucketMs > 0 ? reported <= start || bucketStart >= end : reported < start || reported > end) continue;

    const timestamp = new Date(bucketStart).toISOString();
    const coverageRaw = coverageIndex === undefined ? '' : cells[coverageIndex];
    const coverage = coverageRaw === '' || coverageRaw === undefined || isNaN(Number(coverageRaw)) ? null : Number(coverageRaw) / 100;

    for (const channel of channels) {
        const cell = cells[rawIndex[channel]];
        // Intervals with no coverage come back empty — drop them so they leave
        // a genuine gap in the chart rather than plotting as zero.
        if (cell === undefined || cell === '') continue;
        const value = Number(cell);
        if (isNaN(value)) continue;
        out.push({ timestamp, channel, value, coverage });
    }
}

result = out;
