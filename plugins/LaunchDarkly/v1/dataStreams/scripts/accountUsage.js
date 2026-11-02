// The API returns one wide row per time bucket: { time, "0": n, "1": n, ... }, where each numeric
// key is an index into metadata[] describing that series by its grouping dimensions, e.g.
// { projectId, projectKey, projectName } for groupBy=projectId. With no groupBy there is a single
// series whose metadata entry is empty. Unpivot into one row per (time, group).
const display = (value) => (typeof value === "string" ? value : JSON.stringify(value));

// One label part per dimension, preferring its Name, then Key, then Id (projectName > projectKey > projectId).
const labelFor = (key) => {
    const entry = (data?.metadata || [])[Number(key)];
    if (!entry || typeof entry !== "object") {
        return "Total";
    }
    const dimensions = {};
    for (const [field, value] of Object.entries(entry)) {
        if (field === "_links" || value === undefined || value === null || value === "") {
            continue;
        }
        const match = field.match(/^(.*?)(Name|Key|Id)$/);
        const base = match && match[1] ? match[1] : field;
        const kind = match && match[1] ? match[2] : "Name";
        (dimensions[base] = dimensions[base] || {})[kind] = value;
    }
    const parts = Object.values(dimensions).map((d) => display(d.Name ?? d.Key ?? d.Id));
    return parts.length ? parts.join(" / ") : "Total";
};

result = (data?.series || []).flatMap((bucket) => {
    const time = new Date(bucket.time).toISOString();
    return Object.keys(bucket)
        .filter((key) => key !== "time")
        .map((key) => ({
            time,
            group: labelFor(key),
            value: Number(bucket[key]) || 0,
        }));
});
