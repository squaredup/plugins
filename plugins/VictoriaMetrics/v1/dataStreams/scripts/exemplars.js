// Response body: { status, data: [{ seriesLabels, exemplars: [{ labels, value, timestamp }] }] }
const list = Array.isArray(data?.data) ? data.data : [];
result = list.flatMap((s) => {
    const seriesLabels = s.seriesLabels || {};
    const { __name__, ...rest } = seriesLabels;
    const series = `${__name__ || ''}{${Object.entries(rest).map(([k, v]) => `${k}="${v}"`).join(',')}}`;
    return (s.exemplars || []).map((e) =>
        Object.assign({}, seriesLabels, e.labels || {}, { series, value: Number(e.value), timestamp: new Date(Number(e.timestamp) * 1000).toISOString() })
    );
});
