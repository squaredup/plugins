// data.result is an array of _type strings for all published documents.
// Use lodash countBy to tally occurrences, then emit one row per type.
const counts = _.countBy(data.result || []);
result = Object.entries(counts).map(([documentType, count]) => ({
    documentType,
    count,
}));
