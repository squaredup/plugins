// dataStreams/scripts/search.js
//
// A row's "_timestamp" field (leading underscore) is invisible to
// metadata valueExpression lookups ($['_timestamp'] / $._timestamp both
// resolve to undefined even though the key is present in the raw row and
// declared in metadata) - so the microseconds -> ISO 8601 conversion for the
// date-shaped column has to happen here instead. It's written to
// "recordTime" rather than "timestamp" so it can't overwrite a column the
// user's SQL selects as "timestamp", and stays null when the query doesn't
// return "_timestamp" (e.g. an aggregate like SELECT count(*)).
result = (data.hits || []).map((row) => ({
    ...row,
    recordTime: row._timestamp != null ? new Date(row._timestamp / 1000).toISOString() : null,
}));
