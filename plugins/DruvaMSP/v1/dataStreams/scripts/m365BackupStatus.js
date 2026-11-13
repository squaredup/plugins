// Optional `customer` object picker; empty means no filter. Picked objects expose
// their properties as single-element arrays.
const unwrap = (v) => (Array.isArray(v) ? v[0] : v);
const picked = (name) => (context.config && context.config[name]) || [];

const customerIds = new Set(picked('customer').map((o) => unwrap(o.rawId)).filter(Boolean));

// The threshold arrives as a number (or a string, or nothing when unset); fall back to 24.
const rawThreshold = context.config && context.config.staleAfterHours;
const parsed = rawThreshold === undefined || rawThreshold === null || rawThreshold === '' ? NaN : Number(rawThreshold);
const staleAfterHours = Number.isFinite(parsed) ? parsed : 24;
const now = Date.now();

result = (data.data || [])
    // Deleted users are not an RPO risk.
    .filter((r) => r.isDeleted !== 'Yes')
    .filter((r) => !customerIds.size || customerIds.has(r.customerGlobalId))
    .map((r) => {
        // endTime is the last backup attempt (a failed attempt for failed rows), not
        // the last success, which this report does not provide.
        const end = r.endTime ? Date.parse(r.endTime) : NaN;
        const hours = Number.isNaN(end) ? null : Math.max(0, (now - end) / 3600000);
        const failed = r.lastBackupStatus === 'Backup Failed' || r.lastBackupStatus === 'Never Backed Up';
        let atRisk = 'Protected';
        if (failed || (hours !== null && hours > staleAfterHours)) {
            atRisk = 'At risk';
        } else if (r.lastBackupStatus === 'Backed Up With Errors') {
            atRisk = 'Warning';
        }
        return {
            dcpUniqueKey: r.dcpUniqueKey,
            customerGlobalId: r.customerGlobalId,
            customer: r.customerName,
            userName: r.userName,
            userEmail: r.userEmail,
            workloadType: r.workloadType,
            atRisk,
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
