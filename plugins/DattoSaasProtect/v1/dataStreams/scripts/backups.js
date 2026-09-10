// The applications endpoint (v1GetSaaSBackupData) nests backup runs four levels deep:
// items[] -> suites[] -> appTypes[] -> backupHistory[]. Flatten to one row per
// app type per day-window.
//
// The API's startTime and endTime are inverted: startTime is consistently the later
// of the two, exactly 24h after endTime. Emit them in the correct order so charts sort.
//
// GOTCHA: items[].usedBytes (-> customerTotalUsedBytes below) is NOT the sum of this
// customer's appTypes[].usedBytes (-> usedBytes below) - it's consistently equal to or
// larger, by anywhere from ~0% to ~10% across sampled customers, never derivable from
// the per-app figures. It lines up with Datto's documented billing metric ("total stored
// size", one figure per customer, computed after compression/dedup, and - unlike the
// per-app figures here - inclusive of every retained historical backup version, not just
// the current state). See docs/README.md "Known limitations" before reconciling the two.

// The API returns appType as an unspaced concatenation of the suite and the application,
// e.g. suiteType "Office365" + "Exchange" -> "Office365Exchange". Split on the suite
// prefix the row already carries rather than a hardcoded list, so a suite or application
// Datto adds later still formats. Anything that doesn't match - including a value the API
// already returns with spaces - is passed through untouched.
const prettyAppType = (appType, suiteType) => {
    if (typeof appType !== 'string' || appType.includes(' ')) {
        return appType;
    }
    if (typeof suiteType === 'string' && suiteType && appType.startsWith(suiteType) && appType.length > suiteType.length) {
        return `${suiteType} - ${appType.slice(suiteType.length)}`;
    }
    return appType;
};

// backupHistory[].timeWindow labels each 24h bucket by its age in days, counting back
// from now: "Between0dAnd1d" is the most recent day, "Between1dAnd2d" the one before it.
// Unrecognised values pass through untouched.
const prettyTimeWindow = (timeWindow) => {
    const match = /^Between(\d+)dAnd(\d+)d$/.exec(timeWindow || '');
    if (!match) {
        return timeWindow;
    }
    const [from, to] = [Number(match[1]), Number(match[2])];
    return from === 0 ? 'Last 24 hours' : `${from}-${to} days ago`;
};

// Datto only serves *trailing* history: daysUntil counts back from today and the API
// rejects anything past 30 (backups.json derives it from the selected timeframe). A
// timeframe reaching further back than that - Last month, most of the year - can only be
// answered in part, and a timeframe that closed before today is answered with the wrong
// days entirely unless the surplus is dropped. So trim every row to the requested window
// and, when the window starts beyond Datto's reach, say so rather than showing a short
// month as if it were complete.
const MAX_HISTORY_DAYS = 30;
const tfStartMs = Number.isFinite(context.timeframe?.unixStart) ? context.timeframe.unixStart * 1000 : null;
const tfEndMs = Number.isFinite(context.timeframe?.unixEnd) ? context.timeframe.unixEnd * 1000 : null;
const earliestReachableMs = Date.now() - MAX_HISTORY_DAYS * 86400000;
// The timeframe is resolved fractionally before this script runs, so Last 30 days starts a
// few milliseconds beyond the reach computed here. Tolerate an hour of that skew, well
// under the smallest real shortfall (a day), so only genuine gaps warn.
const REACH_TOLERANCE_MS = 3600000;

// A row is a 24h bucket, so keep it when that bucket overlaps the timeframe at all.
// Rows the API returned without usable timestamps are kept - better a stray row than a
// silently emptied tile.
const inTimeframe = (windowStart, windowEnd) => {
    if (windowStart === null || windowEnd === null) {
        return true;
    }
    return (tfStartMs === null || windowEnd > tfStartMs) && (tfEndMs === null || windowStart < tfEndMs);
};

if (tfStartMs !== null && tfStartMs < earliestReachableMs - REACH_TOLERANCE_MS) {
    const from = new Date(earliestReachableMs).toISOString().slice(0, 10);
    api?.report?.warning(
        `Datto only returns the last ${MAX_HISTORY_DAYS} days of backup history, so this timeframe is only covered from ${from} onwards. Earlier days are not available from the API.`
    );
}

const rows = [];

for (const customer of data?.items || []) {
    for (const suite of customer.suites || []) {
        for (const app of suite.appTypes || []) {
            const lastFullyProtected = Number(app.lastFullyProtectedTime);

            for (const run of app.backupHistory || []) {
                const times = [run.startTime, run.endTime].filter((t) => typeof t === 'number');
                const windowStart = times.length ? Math.min(...times) : null;
                const windowEnd = times.length ? Math.max(...times) : null;

                if (!inTimeframe(windowStart, windowEnd)) {
                    continue;
                }

                rows.push({
                    customerName: customer.customerName,
                    customerId: customer.customerId,
                    customerTotalUsedBytes: customer.usedBytes,
                    suiteType: suite.suiteType,
                    appType: prettyAppType(app.appType, suite.suiteType),
                    timeWindow: prettyTimeWindow(run.timeWindow),
                    status: run.status,
                    windowStart,
                    windowEnd,
                    activeServiceCount: run.activeServiceCount,
                    activeServiceWithBackupCount: run.activeServiceWithBackupCount,
                    activeServiceWithPerfectBackupCount: run.activeServiceWithPerfectBackupCount,
                    totalServiceCount: run.totalServiceCount,
                    uningestedServiceCount: app.uningestedServiceCount,
                    usedBytes: app.usedBytes,
                    lastFullyProtectedTime: Number.isFinite(lastFullyProtected) ? lastFullyProtected : null
                });
            }
        }
    }
}

result = rows;
