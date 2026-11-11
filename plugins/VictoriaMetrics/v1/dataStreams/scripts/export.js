// Response body is NDJSON: one { metric, values: [...], timestamps: [ms, ...] } per line.
// A single-series response is auto-parsed into one object; multi-series stays text.
// Rows carry only the series identity (not every label) to stay under the ~6MB response cap.
const body = response?.body !== undefined ? response.body : data;
let seriesList = [];
if (typeof body === 'string') {
    seriesList = body
        .split('\n')
        .map((l) => l.trim())
        .filter((l) => l.length > 0)
        .map((l) => {
            try { return JSON.parse(l); } catch (e) { return null; }
        })
        .filter((s) => s);
} else if (Array.isArray(body)) {
    seriesList = body;
} else if (body && typeof body === 'object') {
    seriesList = [body];
}

const rows = [];
seriesList.forEach((s) => {
    const metric = s.metric || {};
    const { __name__, ...rest } = metric;
    const series = `${__name__ || ''}{${Object.entries(rest).map(([k, v]) => `${k}="${v}"`).join(',')}}`;
    (s.timestamps || []).forEach((t, i) => {
        rows.push({ __name__: __name__ || null, series, timestamp: new Date(Number(t)).toISOString(), value: Number(s.values[i]) });
    });
});
result = rows;
