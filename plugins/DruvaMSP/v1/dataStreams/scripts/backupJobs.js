// Optional `customer` object picker; empty means no restriction.
// The Customer sourceId is the Druva customerGlobalId, so rawId compares directly.
const unwrap = (v) => (Array.isArray(v) ? v[0] : v);
const cfg = context.config || {};
const customers = cfg.customer || [];
const customerIds = new Set(customers.map((o) => unwrap(o.rawId)).filter(Boolean));

const na = (v) => (v === undefined || v === null || v === '' || v === 'NA' ? null : v);

const minutes = (r) => {
    if (!r.started || !r.ended) return null;
    const ms = Date.parse(r.ended) - Date.parse(r.started);
    return Number.isNaN(ms) || ms < 0 ? null : Math.round((ms / 60000) * 10) / 10;
};

// Only the columns the stream exposes are returned to keep rows small.
result = (data.data || [])
    .filter((r) => !customerIds.size || customerIds.has(r.customerGlobalId))
    .map((r) => ({
        customerGlobalId: r.customerGlobalId,
        backupSet: na(r.backupSet),
        vm: na(r.vm),
        workloads: na(r.workloads),
        backupType: na(r.backupType),
        status: r.status === 'Backup window expired' ? 'Window expired' : na(r.status),
        details: na(r.details),
        started: na(r.started),
        ended: na(r.ended),
        durationMinutes: minutes(r),
        backupPolicy: na(r.backupPolicy),
        dcpUniqueKey: r.dcpUniqueKey,
        jobID: r.jobID
    }));

// Druva returns `nextPageToken` as an empty string on the last page rather than
// omitting it, so the platform's built-in token extraction reads "" as a valid
// cursor, re-requests with it, and trips the paging loop guard.
// Normalise the empty string to undefined here to end paging.
pagingContext = data.nextPageToken || undefined;
