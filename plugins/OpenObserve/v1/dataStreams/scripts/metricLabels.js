// dataStreams/scripts/metricLabels.js
// Exclude "__name__" - that's the metric-name selector itself, not a real
// dimension worth offering in the "Filter by label" picker.
result = (data.data || [])
    .filter((l) => l !== "__name__")
    .map((l) => ({ result: l }));
