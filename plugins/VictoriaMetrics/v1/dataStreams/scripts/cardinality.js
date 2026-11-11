// Response body: { status, data: { totalSeries, totalLabelValuePairs, seriesCountBy...: [{ name, value, ... }] } }
const d = data?.data || {};
const toDate = (s) => (s ? new Date(Number(s) * 1000).toISOString() : null);
const sections = [
    ['Metric name', d.seriesCountByMetricName],
    ['Label name', d.seriesCountByLabelName],
    ['Label value pair', d.seriesCountByLabelValuePair],
    ['Focus label value', d.seriesCountByFocusLabelValue],
    ['Values per label', d.labelValueCountByLabelName]
];
const rows = [];
if (d.totalSeries !== undefined) rows.push({ category: 'Total', name: 'Series', value: Number(d.totalSeries) });
if (d.totalLabelValuePairs !== undefined) rows.push({ category: 'Total', name: 'Label value pairs', value: Number(d.totalLabelValuePairs) });
sections.forEach(([category, list]) => {
    (Array.isArray(list) ? list : []).forEach((e) => {
        rows.push({
            category,
            name: e.name,
            value: Number(e.value),
            requestsCount: e.requestsCount === undefined ? null : Number(e.requestsCount),
            lastRequest: toDate(e.lastRequestTimestamp)
        });
    });
});
result = rows;
