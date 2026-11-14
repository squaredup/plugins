// dataStreams/scripts/pipelineHistory.js
// "timestamp"'s valueExpression previously self-referenced $['timestamp']
// (the same column it was overriding), which rendered empty - the same
// class of bug fixed in tracesLatest's trace_id link. Compute it as a real
// field here instead, matching the proven pattern used elsewhere in this
// plugin.
// "error" is null on every successful run, and a column that's null in every
// row fails to convert to its shape ("Failed to convert to string"), so it's
// coerced to "". delay_in_secs/evaluation_took_in_secs were always null on the
// instance tested (no honest stand-in value), so they aren't exposed.
result = (data.hits || []).map((entry) => ({
    ...entry,
    timestamp: new Date(entry.timestamp / 1000).toISOString(),
    error: entry.error == null ? "" : entry.error,
}));
