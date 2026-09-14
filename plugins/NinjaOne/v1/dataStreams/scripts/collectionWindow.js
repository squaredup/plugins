// Applies the upper end of the timeframe to a /v2/queries/* monitoring snapshot, and
// serialises the epoch timestamps those endpoints return.
//
// NinjaOne's `ts` filter accepts exactly one clause - `after X` and `before Y` each work
// alone, but `after X and before Y`, `between X and Y` and a repeated `ts` arg all fail
// (500 InvalidFilterException, or the second clause is silently ignored). So the request
// supplies the lower bound as `after unixStart` and the upper bound is applied here. Same
// split as Vercel's deployments.js, for the same reason.
//
// Cheap by construction: these endpoints return one current row per item and hold no
// history, so a wider window never returns more rows than an unfiltered request - this
// trims at most one inventory table.
const items = (data && data.results ? data.results : (Array.isArray(data) ? data : []));

// `timeframe.start`/`end` still resolve to a default 24-hour window when the tile is set to
// "None", so the enum has to be checked explicitly - reading unixEnd alone would apply a
// silent 24-hour filter to a request the user asked to be unfiltered.
const tf = context.timeframe || {};
const endTime = tf.enum === 'none' ? null : tf.unixEnd;

// Rows with no `timestamp` never reach this filter: whenever a window is selected the
// request carries `after unixStart`, which NinjaOne already applies server-side, and it
// drops them. The typeof check is belt-and-braces.
const kept = typeof endTime === 'number'
    ? items.filter((item) => typeof item.timestamp === 'number' && item.timestamp <= endTime)
    : items;

// Every date column on these endpoints is declared `number`/`double` in NinjaOne's spec,
// so convert to ISO 8601 for the `date` shape. Named rather than key-sniffed: the
// recursive helper the other scripts share matches on substrings and silently misses
// fields (devices.js drops `created` and the backup job dates that way).
// Runs after the filter, which compares against unixEnd in epoch seconds.
const EPOCH_FIELDS = ['timestamp', 'detectedAt', 'lastBootTime', 'installedAt'];

const toIso = (value) =>
    typeof value === 'number' && value > 1000000000 && value < 10000000000
        ? new Date(value * 1000).toISOString()
        : value;

result = kept.map((item) => {
    const row = { ...item };
    EPOCH_FIELDS.forEach((field) => {
        if (field in row) {
            row[field] = toIso(row[field]);
        }
    });
    return row;
});
