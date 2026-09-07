// The applications endpoint (v1GetSaaSBackupData) nests backup runs four levels deep:
// items[] -> suites[] -> appTypes[] -> backupHistory[]. Flatten to one row per
// app type per day-window.
//
// The API's startTime and endTime are inverted: startTime is consistently the later
// of the two, exactly 24h after endTime. Emit them in the correct order so charts sort.
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
