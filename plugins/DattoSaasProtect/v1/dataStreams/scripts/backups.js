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
const rows = [];

for (const customer of data?.items || []) {
    for (const suite of customer.suites || []) {
        for (const app of suite.appTypes || []) {
            const lastFullyProtected = Number(app.lastFullyProtectedTime);

            for (const run of app.backupHistory || []) {
                const times = [run.startTime, run.endTime].filter((t) => typeof t === 'number');

                rows.push({
                    customerName: customer.customerName,
                    customerId: customer.customerId,
                    customerTotalUsedBytes: customer.usedBytes,
                    suiteType: suite.suiteType,
                    appType: app.appType,
                    timeWindow: run.timeWindow,
                    status: run.status,
                    windowStart: times.length ? Math.min(...times) : null,
                    windowEnd: times.length ? Math.max(...times) : null,
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
