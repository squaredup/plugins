// Date histogram buckets carry an ISO date in key_as_string; other aggregations may use it for
// formatted numbers or booleans, so only ISO dates become the bucketTime column.
const ISO_DATE = /^[0-9]{4}-[0-9]{2}-[0-9]{2}T/;

const bucketRows = (buckets) => {
    // Keyed aggregations (named filters, keyed ranges) return buckets as an object
    const list = Array.isArray(buckets) ? buckets : Object.entries(buckets).map(([key, b]) => ({ key, ...b }));
    return list.map((b) => (typeof b.key_as_string === 'string' && ISO_DATE.test(b.key_as_string) ? { bucketTime: b.key_as_string, ...b } : b));
};

// Values requested with fields, docvalue_fields or script_fields always arrive as arrays
const fieldValues = (fields) =>
    Object.fromEntries(Object.entries(fields || {}).map(([name, v]) => [name, Array.isArray(v) && v.length === 1 ? v[0] : v]));

const aggregations = data && data.aggregations;

if (aggregations && Object.keys(aggregations).length > 0) {
    // OpenSearch places pipeline aggregations after the aggregations they read from,
    // so the last one in the response is the final result.
    const agg = aggregations[Object.keys(aggregations).at(-1)];

    if (agg.buckets) {
        result = bucketRows(agg.buckets);
    } else if (Array.isArray(agg.values)) {
        result = agg.values; // percentiles with keyed: false
    } else if (agg.values) {
        result = [agg.values];
    } else if ('value' in agg) {
        // Single-value metrics; a zero or null (no documents) value keeps the same row shape
        result = [{ value: agg.value }];
    } else {
        result = [agg];
    }
} else {
    result = ((data && data.hits && data.hits.hits) || []).map((hit) => ({
        ...hit._source,
        ...fieldValues(hit.fields),
        _id: hit._id,
        _index: hit._index,
        _score: hit._score
    }));
}
