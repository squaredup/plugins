// CPU arrives as cumulative per-mode counters, so it needs converting to a busy percentage; every other metric is a plain gauge
const metric = String(context.config.metric || "cpu").split(":")[0];
const series = data?.data?.result || [];
const iso = (t) => new Date(Number(t) * 1000).toISOString();

if (metric === "cpu") {
    // Sum the counters across modes per timestamp, tracking idle separately
    const byTime = {};
    for (const s of series) {
        for (const [t, v] of s.values || []) {
            const e = (byTime[t] = byTime[t] || { total: 0, idle: 0, modes: {} });
            e.total += Number(v);
            e.modes[s.metric.mode] = Number(v);
            if (s.metric.mode === "idle") e.idle = Number(v);
        }
    }
    const times = Object.keys(byTime).map(Number).sort((a, b) => a - b);
    const rows = [];
    for (let i = 1; i < times.length; i++) {
        const prev = byTime[times[i - 1]];
        const cur = byTime[times[i]];
        const dTotal = cur.total - prev.total;
        const dIdle = cur.idle - prev.idle;
        // A counter reset (reboot) makes a delta negative, so skip that interval
        const reset = Object.keys(cur.modes).some((m) => cur.modes[m] - (prev.modes[m] ?? 0) < 0);
        if (reset || dTotal <= 0) continue;
        rows.push({ timestamp: iso(times[i]), value: 100 * (1 - dIdle / dTotal), bytes: null, series: "CPU", unit: "%" });
    }
    result = rows;
} else {
    const unit = metric.startsWith("memory") || metric.startsWith("filesystem") ? "bytes" : metric.startsWith("load") ? "load" : "";
    result = series.flatMap((s) => {
        const m = s.metric || {};
        const label = m.mountpoint || [m.interface, m.direction].filter(Boolean).join(" ") || metric;
        return (s.values || []).map(([t, v]) => ({ timestamp: iso(t), value: Number(v), bytes: unit === "bytes" ? Number(v) : null, series: label, unit }));
    });
}
