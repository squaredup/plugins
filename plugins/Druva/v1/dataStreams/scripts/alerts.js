// Optional `customer` object picker; empty means all customers. The report's
// customerGlobalId is the indexed Customer's sourceId (its rawId).
const unwrap = (v) => (Array.isArray(v) ? v[0] : v);
const selected = (context.config && context.config.customer) || [];
const customerIds = new Set(selected.map((o) => unwrap(o.rawId)).filter(Boolean));

result = (data.data || []).filter((a) => !customerIds.size || customerIds.has(a.customerGlobalId));

// Druva returns `nextPageToken` as an empty string on the last page rather than
// omitting it, so the platform's built-in token extraction reads "" as a valid
// cursor, re-requests with it, and trips the paging loop guard.
// Normalise the empty string to undefined here to end paging.
pagingContext = data.nextPageToken || undefined;
