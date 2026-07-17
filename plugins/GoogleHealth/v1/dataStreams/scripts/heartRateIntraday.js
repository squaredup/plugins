// rollUp of heart-rate. RollupDataPoint: { startTime, endTime, heartRate:{ beatsPerMinuteAvg, beatsPerMinuteMin, beatsPerMinuteMax } }
const points = data?.rollupDataPoints || [];

const N = (v) => {
    const n = Number(v);
    return Number.isFinite(n) ? n : undefined;
};
const round = (v) => (v === undefined ? undefined : Math.round(v));

result = points
    .map((pt) => {
        const hr = pt.heartRate;
        if (!hr) return null;
        return {
            time: pt.startTime ? new Date(pt.startTime) : undefined,
            avgBpm: round(N(hr.beatsPerMinuteAvg)),
            minBpm: round(N(hr.beatsPerMinuteMin)),
            maxBpm: round(N(hr.beatsPerMinuteMax)),
        };
    })
    .filter((r) => r && r.time && r.avgBpm !== undefined);
