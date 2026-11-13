// Optional `customer` and `tenant` object pickers; empty means no filter on that
// dimension. Picked objects expose their properties as single-element arrays.
const unwrap = (v) => (Array.isArray(v) ? v[0] : v);
const picked = (name) => (context.config && context.config[name]) || [];

const customerIds = new Set(picked('customer').map((o) => unwrap(o.rawId)).filter(Boolean));

// The report has no tenant id. Every row belongs to the "SaaS Apps and Endpoints"
// product, and customer + product identifies exactly one tenant, so a tenant
// matches only when it is the SaaS tenant of the row's customer.
const tenants = picked('tenant');
const tenantCustomerIds = new Set(
    tenants
        .filter((o) => unwrap(o.productName) === 'SaaS Apps and Endpoints')
        .map((o) => unwrap(o.customerId))
        .filter(Boolean)
);

const parsed = Number(context.config && context.config.staleAfterHours);
const staleAfterHours = Number.isFinite(parsed) && context.config.staleAfterHours !== '' ? parsed : 24;
const now = Date.now();

result = (data.data || [])
    // Deleted users are not an RPO risk.
    .filter((r) => r.isDeleted !== 'Yes')
    .filter((r) => !customerIds.size || customerIds.has(r.customerGlobalId))
    .filter((r) => !tenants.length || tenantCustomerIds.has(r.customerGlobalId))
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
