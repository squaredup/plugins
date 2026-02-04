result = data.data.flatMap((site) =>
    site.periods.flatMap((period) =>
        Object.entries(period.data).map(([label, metrics]) => ({
            label,
            timestamp: period.metricTime,
            ...metrics
        }))
    )
);
