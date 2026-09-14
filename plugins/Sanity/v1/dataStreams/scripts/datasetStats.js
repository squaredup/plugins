// data is the stats object: { documents: { count, sizeSum, jsonSizeSum }, fields, types, releases, ... }
// where each metric is { value, limit, unit }. A limit of 0 means "no limit" — emit null
// so percent columns stay empty instead of dividing by zero.
const pctOfLimit = (metric) =>
    metric && metric.limit > 0 ? (metric.value / metric.limit) * 100 : null;

const object = context.objects[0];

result = [
    {
        ...data,
        dataset: object?.name,
        documentsPctOfLimit: pctOfLimit(data.documents?.count),
        jsonSizePctOfLimit: pctOfLimit(data.documents?.jsonSizeSum),
        fieldsPctOfLimit: pctOfLimit(data.fields?.count),
        releasesPctOfLimit: pctOfLimit(data.releases?.count),
    },
];
