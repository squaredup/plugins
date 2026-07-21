// rollUp response: { rollupDataPoints: [ { startTime, endTime, <metricField>:{...} } ] }
// Physical-time windows. int64 sums arrive as strings.
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
    if (pt.heartRate) {
        const v = N(pt.heartRate.beatsPerMinuteAvg);
        return { value: v === undefined ? undefined : Math.round(v), unit: "bpm" };
    }
    return { value: undefined, unit: "" };
};

// Goal from plugin config (settings screen); falls back to a default if unset.
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
};
const gm = GOALMAP[metricName];
const goal = gm ? goalNum(gm[0], gm[1]) : undefined;

const rows = points
    .map((pt) => {
        const { value, unit } = extract(pt);
        return { time: pt.startTime ? new Date(pt.startTime) : undefined, value, unit, metric: metricName };
    })
    .filter((r) => r.time && r.value !== undefined);

// pctOfGoal compares the day's TOTAL to the goal, held constant on every row
// so a mean() monitor reads the same figure the summed gauge shows.
const total = rows.reduce((a, r) => a + (r.value || 0), 0);
const pct = goal ? Math.round((total / goal) * 100) : undefined;
result = rows.map((r) => ({ ...r, goal: goal, pctOfGoal: pct }));
