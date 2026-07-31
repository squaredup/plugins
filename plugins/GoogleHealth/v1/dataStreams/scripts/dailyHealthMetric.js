// list of daily-summary dataPoints. Each DataPoint has one populated field with a
// nested civil `date` {year,month,day} and a single value:
//   dailyRestingHeartRate.beatsPerMinute (bpm)
//   dailyHeartRateVariability.averageHeartRateVariabilityMilliseconds (ms)
//   dailyRespiratoryRate.breathsPerMinute
//   dailyOxygenSaturation.averagePercentage (%)
const pts = data?.dataPoints || [];
const metricName = context?.config?.metric || "";

const N = (v) => {
    const n = Number(v);
    return Number.isFinite(n) ? n : undefined;
};
const civilToDate = (c) =>
    c && c.year ? new Date(Date.UTC(c.year, (c.month || 1) - 1, c.day || 1)) : undefined;

const extract = (dp) => {
    if (dp.dailyRestingHeartRate)
        return { date: dp.dailyRestingHeartRate.date, value: N(dp.dailyRestingHeartRate.beatsPerMinute), unit: "bpm" };
    if (dp.dailyHeartRateVariability)
        return {
            date: dp.dailyHeartRateVariability.date,
            value: N(dp.dailyHeartRateVariability.averageHeartRateVariabilityMilliseconds),
            unit: "ms",
        };
    if (dp.dailyRespiratoryRate)
        return { date: dp.dailyRespiratoryRate.date, value: N(dp.dailyRespiratoryRate.breathsPerMinute), unit: "breaths/min" };
    if (dp.dailyOxygenSaturation)
        return { date: dp.dailyOxygenSaturation.date, value: N(dp.dailyOxygenSaturation.averagePercentage), unit: "%" };
    return { date: undefined, value: undefined, unit: "" };
};

result = pts
    .map((dp) => {
        const { date, value, unit } = extract(dp);
        const v = value === undefined ? undefined : Math.round(value * 10) / 10;
        return { date: civilToDate(date), value: v, unit, metric: metricName };
    })
    .filter((r) => r.date && r.value !== undefined);
