// list of exercise dataPoints. Each: { exercise: { interval:{startTime,endTime},
//   exerciseType, displayName, activeDuration:"Ns", metricsSummary:{...} }, dataSource:{device} }
const pts = data?.dataPoints || [];

const N = (v) => {
    const n = Number(v);
    return Number.isFinite(n) ? n : undefined;
};
const round = (v, dp) => {
    if (v === undefined) return undefined;
    const f = Math.pow(10, dp || 0);
    return Math.round(v * f) / f;
};
// google-duration is a string like "8224s" or "8224.5s"
const durationSeconds = (s) => (typeof s === "string" ? N(s.replace(/s$/, "")) : N(s));

const titleCase = (t) =>
    typeof t === "string"
        ? t.toLowerCase().replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
        : undefined;

result = pts
    .map((pt) => {
        const ex = pt.exercise;
        if (!ex) return null;
        const iv = ex.interval || {};
        const ms = ex.metricsSummary || {};
        let durSec = durationSeconds(ex.activeDuration);
        if (durSec === undefined && iv.startTime && iv.endTime) {
            durSec = (new Date(iv.endTime).getTime() - new Date(iv.startTime).getTime()) / 1000;
        }
        const distMm = N(ms.distanceMillimeters);
        const device = pt.dataSource && pt.dataSource.device;
        return {
            startTime: iv.startTime ? new Date(iv.startTime) : undefined,
            endTime: iv.endTime ? new Date(iv.endTime) : undefined,
            type: ex.displayName || titleCase(ex.exerciseType) || "Workout",
            durationMin: durSec === undefined ? undefined : Math.round(durSec / 60),
            distanceKm: distMm === undefined ? undefined : round(distMm / 1000000, 2),
            calories: round(N(ms.caloriesKcal), 0),
            avgHeartRate: N(ms.averageHeartRateBeatsPerMinute),
            steps: N(ms.steps),
            activeZoneMinutes: N(ms.activeZoneMinutes),
            source: device ? device.displayName || device.formFactor : undefined,
        };
    })
    .filter((r) => r && r.startTime);
