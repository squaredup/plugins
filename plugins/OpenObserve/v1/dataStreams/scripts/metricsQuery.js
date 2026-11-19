// dataStreams/scripts/metricsQuery.js
// Spread each series' labels as individual top-level columns (named exactly
// as the label) instead of one combined JSON blob, with the reserved
// "__name__" label pulled out separately as "name". A label that would
// collide with one of this stream's own columns (or with another label) is
// prefixed with "label_" until it's free, instead of overwriting it (cAdvisor
// metrics, for one, carry a "name" label). "series" identifies each distinct
// label set - PromQL-style, e.g. up{instance="a", job="b"} - for a line graph
// to split on; values are JSON-quoted so quotes in them can't make two label
// sets read the same.
const RESERVED = ["name", "series", "timestamp", "value"];

result = ((data.data && data.data.result) || []).flatMap((s) => {
    const { __name__, ...labels } = s.metric || {};
    // No prototype, so a label named "__proto__" is stored like any other.
    const labelColumns = Object.create(null);
    const keys = Object.keys(labels).sort();
    // Plain label names are taken first, so a prefixed name never displaces one.
    const taken = new Set([...RESERVED, ...keys.filter((key) => !RESERVED.includes(key))]);
    for (const key of keys) {
        let column = key;
        if (RESERVED.includes(key)) {
            column = `label_${key}`;
            while (taken.has(column)) column = `label_${column}`;
            taken.add(column);
        }
        labelColumns[column] = labels[key];
    }
    const labelSet = keys
        .map((key) => `${key}=${JSON.stringify(String(labels[key]))}`)
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
