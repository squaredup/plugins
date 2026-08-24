// dailyRollUp response: { rollupDataPoints: [ { civilStartTime, civilEndTime, <metricField>:{...} } ] }
// Each metric has a distinct value field; int64 sums arrive as strings. See the v4 discovery doc.
const points = data?.rollupDataPoints || [];
const metricName = context?.config?.metric || "";

const N = (v) => {
    const n = Number(v);
    return Number.isFinite(n) ? n : undefined;
};
const sum = (...xs) => {
    const vals = xs.map(N).filter((v) => v !== undefined);
    return vals.length ? vals.reduce((a, b) => a + b, 0) : undefined;
};
const mid = (a, b) => {
    const s = sum(a, b);
    return s === undefined ? undefined : s / 2;
};

const civilToDate = (c) =>
    c && c.date && c.date.year
        ? new Date(Date.UTC(c.date.year, (c.date.month || 1) - 1, c.date.day || 1))
        : undefined;

// Returns { value, unit } for whichever metric field is populated on the point.
const extract = (pt) => {
    if (pt.steps) return { value: N(pt.steps.countSum), unit: "steps" };
    if (pt.distance) {
        const mm = N(pt.distance.millimetersSum);
        return { value: mm === undefined ? undefined : Math.round(mm / 1000) / 1000, unit: "km" };
    }
    if (pt.floors) return { value: N(pt.floors.countSum), unit: "floors" };
    if (pt.activeZoneMinutes) {
        const z = pt.activeZoneMinutes;
        return {
            value: sum(z.sumInFatBurnHeartZone, z.sumInCardioHeartZone, z.sumInPeakHeartZone),
            unit: "min",
        };
    }
    if (pt.activeEnergyBurned) {
        const k = N(pt.activeEnergyBurned.kcalSum);
        return { value: k === undefined ? undefined : Math.round(k), unit: "kcal" };
    }
    if (pt.weight) {
        const g = N(pt.weight.weightGramsAvg);
        return { value: g === undefined ? undefined : Math.round(g / 1000 * 10) / 10, unit: "kg" };
    }
    if (pt.bodyFat) {
        const b = N(pt.bodyFat.bodyFatPercentageAvg);
        return { value: b === undefined ? undefined : Math.round(b * 10) / 10, unit: "%" };
    }
    if (pt.restingHeartRatePersonalRange) {
        const r = pt.restingHeartRatePersonalRange;
        const v = mid(r.beatsPerMinuteMin, r.beatsPerMinuteMax);
        return { value: v === undefined ? undefined : Math.round(v), unit: "bpm" };
    }
    if (pt.runVo2Max) {
        const v = N(pt.runVo2Max.rateAvg);
        return { value: v === undefined ? undefined : Math.round(v * 10) / 10, unit: "mL/kg/min" };
    }
    if (pt.heartRateVariabilityPersonalRange) {
        const h = pt.heartRateVariabilityPersonalRange;
        const v = mid(
            h.averageHeartRateVariabilityMillisecondsMin,
            h.averageHeartRateVariabilityMillisecondsMax
        );
        return { value: v === undefined ? undefined : Math.round(v), unit: "ms" };
    }
    if (pt.hydrationLog) {
        const a = pt.hydrationLog.amountConsumed;
        return { value: a ? N(a.millilitersSum) : undefined, unit: "mL" };
    }
    return { value: undefined, unit: "" };
};

// Goal from plugin config (settings screen); per-day pctOfGoal so a mean() monitor
// reflects the average daily attainment shown by the gauge's mean() value.
const cfg = (context && context.dataSources && context.dataSources[0]) || {};
const goalNum = (k, d) => {
    const n = Number(cfg[k]);
    return Number.isFinite(n) && n > 0 ? n : d;
};
const GOALMAP = {
    steps: ["stepGoal", 10000],
    distance: ["distanceGoal", 8],
    "active-energy-burned": ["activeCalorieGoal", 600],
    "active-zone-minutes": ["zoneMinutesGoal", 22],
    "hydration-log": ["waterGoal", 2000],
};
const gm = GOALMAP[metricName];
const goal = gm ? goalNum(gm[0], gm[1]) : undefined;

result = points
    .map((pt) => {
        const { value, unit } = extract(pt);
        return {
            date: civilToDate(pt.civilStartTime),
            value,
            unit,
            metric: metricName,
            goal: goal,
            pctOfGoal: goal && value !== undefined ? Math.round((value / goal) * 100) : undefined,
        };
    })
    .filter((r) => r.date && r.value !== undefined);

// Snapshot fix: a snapped single-day window with no data should render as an
// explicit zero (0 of goal, red) rather than an empty gauge with no maximum.
if (
    result.length === 0 &&
    goal !== undefined &&
    new Date(context.timeframe.end).getTime() - new Date(context.timeframe.start).getTime() <= 90000000
) {
    // Match the request's snapped day (the day containing timeframe.end - 1ms)
    // so a window ending exactly at midnight doesn't attribute the zero to the next day.
    const snapshotDay = new Date(new Date(context.timeframe.end).getTime() - 1);
    result = [
        {
            date: new Date(Date.UTC(snapshotDay.getUTCFullYear(), snapshotDay.getUTCMonth(), snapshotDay.getUTCDate())),
            value: 0,
            unit: ({steps:"steps",distance:"km",floors:"floors","active-zone-minutes":"min","active-energy-burned":"kcal","hydration-log":"mL"})[metricName] || "",
            metric: metricName,
            goal: goal,
            pctOfGoal: 0,
        },
    ];
}
