// PRTG reads `filter_dstart`/`filter_dend` in the time zone of the account whose
// API key is in use, with no way to ask for UTC. Rather than make that zone a
// setting, the request window is widened by 12 hours before and 14 hours after
// (the full range of real UTC offsets) and trimmed back here using `datetime_raw`,
// which PRTG always reports as a UTC OLE date.
const toMs = (v) => (typeof v === 'number' ? (v < 1e12 ? v * 1000 : v) : new Date(v).getTime());
const tf = (context && context.timeframe) || {};
const start = toMs(tf.start);
const end = toMs(tf.end);

const rows = (data && data.messages) || [];
result = rows.filter((row) => {
    const at = (Number(row.datetime_raw) - 25569) * 86400000;
    return isFinite(at) && at >= start && at <= end;
});
