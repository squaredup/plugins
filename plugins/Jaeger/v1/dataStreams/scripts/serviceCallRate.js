// dataStreams/scripts/serviceCallRate.js
//
// Jaeger serialises the metrics APIs with gogo's jsonpb marshaler, which gives
// a single MetricFamily in camelCase with default values omitted: a genuinely
// zero point arrives as an empty `gaugeValue: {}`, not as `doubleValue: 0`.
// Prometheus gaps come back as the string "NaN" (JSON has no NaN literal), so
// coerce and drop anything non-finite rather than charting it.
//
// Each row is one point of one series — calls per second.

const series = (data && data.metrics) || [];

result = _.filter(
    _.flatMap(series, (s) => {
        const labels = _.fromPairs((s.labels || []).map((l) => [l.name, l.value]));
        return (s.metricPoints || []).map((point) => {
            const gauge = point.gaugeValue || {};
            const raw = gauge.doubleValue !== undefined ? gauge.doubleValue : gauge.intValue;
            return {
                timestamp: point.timestamp,
                service: labels.service_name,
                operation: labels.operation,
                value: Number(raw === undefined ? 0 : raw),
            };
        });
    }),
    (row) => row.timestamp && Number.isFinite(row.value),
);
