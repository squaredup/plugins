// Optional `customer` object picker; empty means no filter.
// The report's customerGlobalId is the indexed Customer's sourceId (its rawId).
// Picked objects expose properties as single-element arrays, so unwrap them.
const unwrap = (v) => (Array.isArray(v) ? v[0] : v);
const cfg = context.config || {};

const customerIds = new Set((cfg.customer || []).map((o) => unwrap(o.rawId)).filter(Boolean));

// The threshold arrives as a number (or a string, or nothing when unset); fall back to 24.
const rawThreshold = cfg.staleAfterHours;
const parsed = rawThreshold === undefined || rawThreshold === null || rawThreshold === '' ? NaN : Number(rawThreshold);
const staleAfterHours = Number.isFinite(parsed) ? parsed : 24;

const now = Date.now();
const OK_STATUS = 'Backed Up Successfully';

result = (data.data || [])
    .filter((r) => Number(r.isDeleted) !== 1)
    .filter((r) => !customerIds.size || customerIds.has(r.customerGlobalId))
    .map((r) => {
        const end = r.endTime ? new Date(r.endTime).getTime() : NaN;
        const hours = Number.isFinite(end) ? (now - end) / 3600000 : null;
        // Any status other than the success wording, a missing end time, or a stale
        // last backup counts as at risk.
        const atRisk = r.status !== OK_STATUS || hours === null || hours > staleAfterHours;
        return { ...r, hoursSinceLastBackup: hours, atRisk: atRisk ? 'At risk' : 'Protected' };
    });

// Druva returns `nextPageToken` as an empty string on the last page rather than
// omitting it, so the platform's built-in token extraction reads "" as a valid
// cursor and trips the paging loop guard. Normalise to undefined to end paging.
pagingContext = data.nextPageToken || undefined;
