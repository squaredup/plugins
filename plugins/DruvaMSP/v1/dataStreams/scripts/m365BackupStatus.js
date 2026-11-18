// Druva's own status is returned unchanged; how to classify it is left to tile
// filters and monitoring in SquaredUp. The script only adds the attempt's age.
const now = Date.now();

result = (data.data || [])
    .map((r) => {
        // endTime is the last backup attempt (a failed attempt for failed rows), not
        // the last success, which this report does not provide.
        const end = r.endTime ? Date.parse(r.endTime) : NaN;
        const hours = Number.isNaN(end) ? null : Math.max(0, (now - end) / 3600000);
        return {
            dcpUniqueKey: r.dcpUniqueKey,
            customerGlobalId: r.customerGlobalId,
            customerName: r.customerName,
            userName: r.userName,
            userEmail: r.userEmail,
            workloadType: r.workloadType,
            lastBackupStatus: r.lastBackupStatus,
            endTime: r.endTime || null,
            hoursSinceLastBackup: hours,
            itemsMissed: r.itemsMissed,
            lastBackupData: r.lastBackupData,
            statusDetails: r.statusDetails
        };
    });

// Druva returns `nextPageToken` as an empty string on the last page; normalise to
// undefined so the platform's paging loop ends.
pagingContext = data.nextPageToken || undefined;
