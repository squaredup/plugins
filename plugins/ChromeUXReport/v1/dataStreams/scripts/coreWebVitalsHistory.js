const metrics = {
    largest_contentful_paint: { name: "LCP", good: 2500, poor: 4000, core: true },
    interaction_to_next_paint: { name: "INP", good: 200, poor: 500, core: true },
    cumulative_layout_shift: { name: "CLS", good: 0.1, poor: 0.25, core: true },
    first_contentful_paint: { name: "FCP", good: 1800, poor: 3000, core: false },
    experimental_time_to_first_byte: { name: "TTFB", good: 800, poor: 1800, core: false }
};
const percent = (density) => (density ?? 0) * 100;
const rate = (value, metric) => (value <= metric.good ? "Good" : value <= metric.poor ? "Needs improvement" : "Poor");
const toDate = (d) => new Date(Date.UTC(d.year, d.month - 1, d.day));

const record = data?.record || {};
const key = record.key || {};
const periods = record.collectionPeriods || [];
// With no timeframe the platform still sends a range ending now, so ignore it
const timeframe = context.timeframe?.enum === "none" ? {} : context.timeframe || {};
const start = timeframe.start ? new Date(timeframe.start) : null;
const end = timeframe.end ? new Date(timeframe.end) : null;

result = Object.entries(metrics)
    .filter(([metricKey]) => record.metrics?.[metricKey])
    .flatMap(([metricKey, metric]) => {
        const values = record.metrics[metricKey];
        const p75s = values.percentilesTimeseries?.p75s || [];
        const bins = values.histogramTimeseries || [];
        return periods.map((period, i) => {
            const periodEnd = toDate(period.lastDate);
            // Weeks with too little traffic come back as null
            if (!Number.isFinite(Number(p75s[i])) || p75s[i] === null) return null;
            if ((start && periodEnd < start) || (end && periodEnd > end)) return null;
            const p75 = Number(p75s[i]);
            return {
                periodEnd: periodEnd.toISOString(),
                target: key.url || key.origin,
                metric: metric.name,
                metricKey,
                p75,
                rating: rate(p75, metric),
                good: percent(bins[0]?.densities?.[i]),
                needsImprovement: percent(bins[1]?.densities?.[i]),
                poor: percent(bins[2]?.densities?.[i]),
                isCoreWebVital: metric.core,
                device: key.formFactor || "ALL",
                level: key.url ? "Page" : "Whole site"
            };
        });
    })
    .filter(Boolean);
