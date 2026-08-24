// list of body-measurement dataPoints (sample types).
//   weight:  { weightGrams, sampleTime:{ civilTime:{ date:{y,m,d} } } }
//   bodyFat: { percentage,  sampleTime:{ civilTime:{ date:{y,m,d} } } }
const pts = data?.dataPoints || [];
const metricName = context?.config?.metric || "";

const N = (v) => {
    const n = Number(v);
    return Number.isFinite(n) ? n : undefined;
};
const civilToDate = (ct) =>
    ct && ct.date && ct.date.year
        ? new Date(Date.UTC(ct.date.year, (ct.date.month || 1) - 1, ct.date.day || 1))
        : undefined;

const extract = (dp) => {
    if (dp.weight) {
        const g = N(dp.weight.weightGrams);
        return {
            ct: dp.weight.sampleTime && dp.weight.sampleTime.civilTime,
            value: g === undefined ? undefined : Math.round((g / 1000) * 10) / 10,
            unit: "kg",
        };
    }
    if (dp.bodyFat) {
        const p = N(dp.bodyFat.percentage);
        return {
            ct: dp.bodyFat.sampleTime && dp.bodyFat.sampleTime.civilTime,
            value: p === undefined ? undefined : Math.round(p * 10) / 10,
            unit: "%",
        };
    }
    return { ct: undefined, value: undefined, unit: "" };
};

result = pts
    .map((dp) => {
        const { ct, value, unit } = extract(dp);
        return { date: civilToDate(ct), value, unit, metric: metricName };
    })
    .filter((r) => r.date && r.value !== undefined);
