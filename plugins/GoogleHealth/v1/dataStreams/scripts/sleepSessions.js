// list of sleep dataPoints. sleep: { interval:{startTime,endTime,civilEndTime},
//   summary:{ minutesAsleep, minutesAwake, minutesInSleepPeriod, stagesSummary:[{type,minutes}] }, stages:[...] }
const pts = data?.dataPoints || [];

const N = (v) => {
    const n = Number(v);
    return Number.isFinite(n) ? n : undefined;
};

const civilToDate = (c) =>
    c && c.date && c.date.year
        ? new Date(Date.UTC(c.date.year, (c.date.month || 1) - 1, c.date.day || 1))
        : undefined;

// Sleep goal (hours) from plugin config, with default.
const cfg = (context && context.dataSources && context.dataSources[0]) || {};
const sleepGoalRaw = Number(cfg.sleepGoal);
const sleepGoal = Number.isFinite(sleepGoalRaw) && sleepGoalRaw > 0 ? sleepGoalRaw : 8;

result = pts
    .map((pt) => {
        const s = pt.sleep;
        if (!s) return null;
        const iv = s.interval || {};
        const sum = s.summary || {};
        const asleep = N(sum.minutesAsleep);
        const awake = N(sum.minutesAwake);
        const inBed = N(sum.minutesInSleepPeriod);

        // Per-stage minutes from stagesSummary.
        const stage = { DEEP: 0, REM: 0, LIGHT: 0, AWAKE: 0, ASLEEP: 0, RESTLESS: 0 };
        for (const st of sum.stagesSummary || []) {
            const m = N(st.minutes);
            if (st.type in stage && m !== undefined) stage[st.type] += m;
        }

        const date = civilToDate(iv.civilEndTime) || (iv.endTime ? new Date(iv.endTime) : undefined);
        const efficiency =
            asleep !== undefined && inBed ? Math.round((asleep / inBed) * 100) : undefined;

        return {
            date: date,
            asleepMin: asleep,
            asleepHours: asleep === undefined ? undefined : Math.round((asleep / 60) * 10) / 10,
            sleepGoalCol: sleepGoal,
            sleepPct:
                asleep === undefined ? undefined : Math.round((asleep / 60 / sleepGoal) * 100),
            efficiencyPct: efficiency,
            deepMin: stage.DEEP || undefined,
            remMin: stage.REM || undefined,
            lightMin: stage.LIGHT || undefined,
            awakeMin: awake ?? (stage.AWAKE || undefined),
            inBedMin: inBed,
            startTime: iv.startTime ? new Date(iv.startTime) : undefined,
            endTime: iv.endTime ? new Date(iv.endTime) : undefined,
        };
    })
    .filter((r) => r && r.date);
