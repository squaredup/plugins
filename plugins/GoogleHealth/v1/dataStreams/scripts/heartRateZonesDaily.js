// dailyRollUp of time-in-heart-rate-zone.
// timeInHeartRateZone.timeInHeartRateZones = [{ heartRateZone: LIGHT|MODERATE|VIGOROUS|PEAK, duration:"Ns" }]
const points = data?.rollupDataPoints || [];

const durMin = (s) => {
    if (typeof s !== "string") return undefined;
    const n = Number(s.replace(/s$/, ""));
    return Number.isFinite(n) ? n / 60 : undefined;
};

result = points
    .map((pt) => {
        const z = pt.timeInHeartRateZone;
        if (!z) return null;
        const zones = { LIGHT: 0, MODERATE: 0, VIGOROUS: 0, PEAK: 0 };
        for (const item of z.timeInHeartRateZones || []) {
            const m = durMin(item.duration);
            if (item.heartRateZone in zones && m !== undefined) zones[item.heartRateZone] += m;
        }
        const total = zones.LIGHT + zones.MODERATE + zones.VIGOROUS + zones.PEAK;
        return {
            date:
                pt.civilStartTime && pt.civilStartTime.date && pt.civilStartTime.date.year
                    ? new Date(
                          Date.UTC(
                              pt.civilStartTime.date.year,
                              (pt.civilStartTime.date.month || 1) - 1,
                              pt.civilStartTime.date.day || 1
                          )
                      )
                    : undefined,
            lightMin: zones.LIGHT,
            moderateMin: zones.MODERATE,
            vigorousMin: zones.VIGOROUS,
            peakMin: zones.PEAK,
            totalMin: total,
        };
    })
    .filter((r) => r && r.date);
