// The ping log endpoint has no time filter, so keep only the pings inside the
// tile timeframe here. It returns the newest pings first, capped by plan.
const check = context.objects[0];
const winStart = Date.parse(context.timeframe.start);
const winEnd = Date.parse(context.timeframe.end);

result = ((data && data.pings) || [])
    .filter((p) => {
        const t = Date.parse(p.date);
        return !Number.isNaN(t) && t >= winStart && t <= winEnd;
    })
    .map((p) => ({
        ...p,
        // Only present on some pings; emitted always so the columns exist for
        // checks that never send start signals or exit codes.
        duration: p.duration ?? null,
        exitstatus: p.exitstatus ?? null,
        checkId: check.rawId,
        checkName: check.name,
    }));
