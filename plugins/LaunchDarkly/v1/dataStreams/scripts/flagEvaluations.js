// The API returns one wide row per time bucket: { time, "0": n, "1": n, ... }, where each numeric
// key is an index into metadata[] (one entry per variation, holding the variation value). Unpivot
// that into one row per (time, variation) so the data can be charted or grouped by variation.
const labelFor = (key) => {
    const entry = (data?.metadata || [])[Number(key)];
    if (entry === undefined || entry === null || Number.isNaN(Number(key))) {
        return key;
    }
    const raw = entry.name ?? entry.key;
    if (raw === undefined || raw === null) {
        return key;
    }
    return typeof raw === "string" ? raw : JSON.stringify(raw);
};

result = (data?.series || []).flatMap((bucket) => {
    const time = new Date(bucket.time).toISOString();
    return Object.keys(bucket)
        .filter((key) => key !== "time")
        .map((key) => ({
            time,
            variation: labelFor(key),
            evaluations: Number(bucket[key]) || 0,
        }));
});
