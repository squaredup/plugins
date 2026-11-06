// dataStreams/scripts/metricsQuery.js
// Spread each series' labels as individual top-level columns (named exactly
// as the label) instead of one combined JSON blob, with the reserved
// "__name__" label pulled out separately as "name". A label that would
// collide with one of this stream's own columns is kept as "label_<name>"
// instead of overwriting it (cAdvisor metrics, for one, carry a "name"
// label). "series" identifies each distinct label set - PromQL-style, e.g.
// up{instance="a", job="b"} - for a line graph to split on.
const RESERVED = ["name", "series", "timestamp", "value"];

result = ((data.data && data.data.result) || []).flatMap((s) => {
    const { __name__, ...labels } = s.metric || {};
    const labelColumns = {};
    for (const [key, val] of Object.entries(labels)) {
        labelColumns[RESERVED.includes(key) ? `label_${key}` : key] = val;
    }
    const labelSet = Object.keys(labels)
        .sort()
        .map((key) => `${key}="${labels[key]}"`)
        .join(", ");
    const series = (__name__ || "") + (labelSet ? `{${labelSet}}` : "");
    return (s.values || []).map(([ts, val]) => ({
        ...labelColumns,
        name: __name__ || "",
        series,
        timestamp: new Date(ts * 1000).toISOString(),
        value: parseFloat(val),
    }));
});
