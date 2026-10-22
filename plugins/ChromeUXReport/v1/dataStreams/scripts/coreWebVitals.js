const metrics = {
    largest_contentful_paint: { name: "LCP", good: 2500, poor: 4000, core: true },
    interaction_to_next_paint: { name: "INP", good: 200, poor: 500, core: true },
    cumulative_layout_shift: { name: "CLS", good: 0.1, poor: 0.25, core: true },
    first_contentful_paint: { name: "FCP", good: 1800, poor: 3000, core: false },
    experimental_time_to_first_byte: { name: "TTFB", good: 800, poor: 1800, core: false }
};
const percent = (density) => Math.round((density ?? 0) * 1000) / 10;
const rate = (value, metric) => (value <= metric.good ? "Good" : value <= metric.poor ? "Needs improvement" : "Poor");
const toDate = (d) => (d ? new Date(Date.UTC(d.year, d.month - 1, d.day)).toISOString() : null);

const record = data?.record || {};
const key = record.key || {};
const periodEnd = toDate(record.collectionPeriod?.lastDate);

result = Object.entries(metrics)
    .filter(([metricKey]) => record.metrics?.[metricKey])
    .map(([metricKey, metric]) => {
        const values = record.metrics[metricKey];
        const p75 = Number(values.percentiles?.p75);
        const bins = values.histogram || [];
        return {
            target: key.url || key.origin,
            metric: metric.name,
            metricKey,
            p75,
            rating: rate(p75, metric),
            good: percent(bins[0]?.density),
            needsImprovement: percent(bins[1]?.density),
            poor: percent(bins[2]?.density),
            isCoreWebVital: metric.core,
            device: key.formFactor || "ALL",
            level: key.url ? "Page" : "Whole site",
            periodEnd
        };
    });
