// Turns the flip events (points in time) into up/down periods clipped to the
// timeframe window. The request deliberately has no `start`, so the last flip
// before the window is available to establish the state at the window start.
const unwrap = (v) => (Array.isArray(v) ? v[0] : v);
const check = context.objects[0];
const checkId = check.rawId;
const checkName = check.name;
const indexedStatus = unwrap(check.status);

const now = Date.now();
const winStart = Date.parse(context.timeframe.start);
const rawEnd = Date.parse(context.timeframe.end);
// A period never extends beyond "now".
const winEnd = Math.min(rawEnd, now);
const reachesNow = rawEnd >= now - 60 * 1000;

// The API wraps the list as { flips: [...] }; tolerate a bare array too.
const flipList = Array.isArray(data) ? data : (data && data.flips) || [];
const flips = flipList
    .map((f) => ({ t: Date.parse(f.timestamp), up: f.up ? 1 : 0 }))
    .filter((f) => !Number.isNaN(f.t))
    .sort((a, b) => a.t - b.t);

const rows = [];
const emit = (from, to, up, isLast) => {
    const s = Math.max(from, winStart);
    const e = Math.min(to, winEnd);
    if (e <= s) {
        return;
    }
    rows.push({
        checkId,
        checkName,
        status: up ? "up" : "down",
        start: new Date(s).toISOString(),
        end: new Date(e).toISOString(),
        durationSeconds: Math.round((e - s) / 1000),
        ongoing: Boolean(isLast && reachesNow),
    });
};

if (flips.length === 0) {
    // Stable for the whole retention period: use the indexed current state.
    if (indexedStatus === "success" || indexedStatus === "warning") {
        emit(winStart, winEnd, true, true);
    } else if (indexedStatus === "error") {
        emit(winStart, winEnd, false, true);
    }
} else {
    flips.forEach((f, i) => {
        const isLast = i === flips.length - 1;
        emit(f.t, isLast ? winEnd : flips[i + 1].t, f.up, isLast);
    });
}

result = rows;
