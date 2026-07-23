// dataStreams/scripts/runs.js
//
// A post-request script is required here (rather than valueExpression) because
// info.end_time and duration_ms both need the RAW numeric epoch values —
// valueExpression's `$['columnName']` only ever exposes the already-shaped
// value of a column (e.g. an ISO date string once `shape: "date"` has been
// applied), so a running run's end_time of 0 can't be distinguished from a
// real timestamp once shaped, and two shaped date-strings can't be subtracted
// to get a millisecond duration.
const mapped = (data.runs || []).map((run) => {
    const info = run.info || {};
    const startTime = info.start_time;
    const endTime = info.end_time || null; // MLflow returns 0 for runs that haven't finished

    return {
        ...run,
        info: {
            ...info,
            end_time: endTime,
        },
        duration_ms: endTime && startTime ? endTime - startTime : null,
    };
});

// Optional `experiment` object-picker parameter (stream `ui` name "experiment").
// Selected objects arrive at context.config.experiment as an ARRAY (multi-select),
// each rawId a single-element array. Empty/absent -> account-wide, no filter.
const unwrap = (v) => (Array.isArray(v) ? v[0] : v);
const selectedExperiments = (context.config && context.config.experiment) || [];
const experimentIds = new Set(
    selectedExperiments.map((o) => unwrap(o.rawId)).filter(Boolean),
);

result = experimentIds.size
    ? mapped.filter((row) => experimentIds.has(row.info.experiment_id))
    : mapped;
